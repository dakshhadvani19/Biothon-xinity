import { storage, databases, APPWRITE_CONFIG } from '../api/appwrite';
import { ID, Query, Permission, Role } from 'appwrite';

// Hardcoded fallbacks so the service works even if .env vars are not loaded
const DB_ID     = APPWRITE_CONFIG.databaseId             || '6a1d47b3002eaafca63b';
const COL_ID    = APPWRITE_CONFIG.userImagesCollectionId || 'userimages';
const BUCKET_ID = APPWRITE_CONFIG.imagesBucketId         || '6a1d4761001a437b2e02';

/**
 * Generates a preview URL using the Appwrite SDK.
 * The SDK attaches the session context, so Appwrite's CORS/auth check passes.
 * Falls back to direct URL if SDK call fails.
 */
const buildViewUrl = (fileId) => {
    if (!fileId) return null;
    try {
        // Use getFileView instead of getFilePreview to avoid 403 "Image transformations blocked on free plan"
        const url = storage.getFileView(BUCKET_ID, fileId);
        return url ? url.href || url.toString() : null;
    } catch {
        return null;
    }
};

/**
 * Computes a SHA-256 hash of the file's binary content.
 * Returns the first 36 hex chars — valid as an Appwrite document/file ID.
 * Identical files produce identical hashes → natural duplicate detection.
 */
const computeFileHash = async (file) => {
    const buffer = await file.arrayBuffer();
    const hashBuffer = await crypto.subtle.digest('SHA-256', buffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    return hashHex.substring(0, 36); // Appwrite ID: max 36 alphanumeric chars
};

export const imageService = {

    /**
     * Uploads a file to Appwrite Storage using its SHA-256 hash as the file ID.
     * If the same image was already uploaded, Appwrite returns the existing file
     * without re-uploading it — zero duplicates.
     * Files are given read("users") so any logged-in user can view their own previews.
     */
    uploadCropImage: async (file, userId) => {
        const fileId = await computeFileHash(file);
        try {
            // Check if this exact file already exists in Storage
            const existing = await storage.getFile(BUCKET_ID, fileId);
            console.log(`[ImageService] ♻️ Duplicate detected — reusing existing file: ${fileId}`);
            return existing;
        } catch {
            // File doesn't exist yet — upload it with permissions
            const permissions = [
                Permission.read(Role.users()),     // any logged-in user can read (SDK session handles auth)
                ...(userId ? [
                    Permission.update(Role.user(userId)),
                    Permission.delete(Role.user(userId)),
                ] : []),
            ];
            return await storage.createFile(BUCKET_ID, fileId, file, permissions);
        }
    },

    getImageViewUrl: (fileId) => buildViewUrl(fileId),

    deleteCropImage: async (fileId) => {
        try {
            await storage.deleteFile(BUCKET_ID, fileId);
            return true;
        } catch (error) {
            console.error('[ImageService] 🚨 Storage Error: Delete Image', error);
            throw error;
        }
    },

    /**
     * Saves a record linking userId → fileId in the userimages collection.
     * Silently skips if the record already exists (409).
     */
    saveUserImageRecord: async (userId, fileId) => {
        try {
            await databases.createDocument(
                DB_ID,
                COL_ID,
                ID.unique(),
                { user_id: userId, file_id: fileId },
                [
                    Permission.read(Role.user(userId)),
                    Permission.write(Role.user(userId)),
                    Permission.delete(Role.user(userId)),
                ]
            );
            console.log(`[ImageService] ✅ Saved image record for user: ${userId}, file: ${fileId}`);
            return true;
        } catch (error) {
            if (error.code === 409 || error.message?.includes('already exists')) {
                console.log(`[ImageService] ♻️ DB record already exists for file: ${fileId}`);
                return true;
            }
            console.error('[ImageService] 🚨 DB record save FAILED:', error.message);
            throw error;
        }
    },

    /**
     * Fetches all image records for a user from the userimages DB collection.
     * Returns images sorted newest first, each with a pre-built image_url.
     */
    getUserImages: async (userId) => {
        try {
            const response = await databases.listDocuments(
                DB_ID,
                COL_ID,
                [
                    Query.equal('user_id', userId),
                    Query.limit(100),
                ]
            );
            return response.documents
                .map(doc => ({
                    $id: doc.$id,
                    file_id: doc.file_id,
                    image_url: buildViewUrl(doc.file_id),
                    createdAt: doc.$createdAt,
                }))
                .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        } catch (err) {
            console.error('[ImageService] 🚨 DB query failed for getUserImages:', err.message);
            return [];
        }
    },
};
