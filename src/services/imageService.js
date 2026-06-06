import { storage, databases, APPWRITE_CONFIG } from '../api/appwrite';
import { ID, Query } from 'appwrite';

// Helper: always returns a guaranteed string URL from a file_id
const buildViewUrl = (fileId) => {
    const url = storage.getFileView(APPWRITE_CONFIG.imagesBucketId, fileId);
    return url ? url.toString() : null;
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
     */
    uploadCropImage: async (file) => {
        const fileId = await computeFileHash(file);
        try {
            // Check if this exact file already exists in Storage
            const existing = await storage.getFile(APPWRITE_CONFIG.imagesBucketId, fileId);
            console.log(`[ImageService] ♻️ Duplicate detected — reusing existing file: ${fileId}`);
            return existing;
        } catch {
            // File doesn't exist yet — upload it fresh
            return await storage.createFile(
                APPWRITE_CONFIG.imagesBucketId,
                fileId,
                file
            );
        }
    },

    getImageViewUrl: (fileId) => {
        try {
            return buildViewUrl(fileId);
        } catch (error) {
            console.error("[ImageService] 🚨 Storage Error: Get Image URL", error);
            return null;
        }
    },

    deleteCropImage: async (fileId) => {
        try {
            await storage.deleteFile(APPWRITE_CONFIG.imagesBucketId, fileId);
            return true;
        } catch (error) {
            console.error("[ImageService] 🚨 Storage Error: Delete Image", error);
            throw error;
        }
    },

    saveUserImageRecord: async (userId, fileId) => {
        if (!APPWRITE_CONFIG.userImagesCollectionId) return; // Guard: skip if not configured
        try {
            // Check if a record for this file_id already exists for this user
            const existing = await databases.listDocuments(
                APPWRITE_CONFIG.databaseId,
                APPWRITE_CONFIG.userImagesCollectionId,
                [Query.equal('user_id', userId), Query.equal('file_id', fileId), Query.limit(1)]
            );
            if (existing.documents.length > 0) {
                console.log(`[ImageService] ♻️ DB record already exists for file: ${fileId}`);
                return true; // Already registered, skip
            }
            await databases.createDocument(
                APPWRITE_CONFIG.databaseId,
                APPWRITE_CONFIG.userImagesCollectionId,
                ID.unique(),
                { user_id: userId, file_id: fileId }
            );
            return true;
        } catch (error) {
            console.warn("[ImageService] ⚠️ DB record save failed (non-critical):", error.message);
            // Non-blocking — images are in Storage regardless
        }
    },

    /**
     * Fetches all image records for a user.
     * Primary: userimages DB (filtered by user_id)
     * Fallback: all files in the Storage bucket
     */
    getUserImages: async (userId) => {
        // Primary: DB query
        if (APPWRITE_CONFIG.userImagesCollectionId) {
            try {
                const response = await databases.listDocuments(
                    APPWRITE_CONFIG.databaseId,
                    APPWRITE_CONFIG.userImagesCollectionId,
                    [
                        Query.equal('user_id', userId),
                        Query.orderDesc('$createdAt'),
                        Query.limit(100),
                    ]
                );
                if (response.documents.length > 0) {
                    return response.documents.map(doc => ({
                        $id: doc.$id,
                        file_id: doc.file_id,
                        image_url: buildViewUrl(doc.file_id),
                        createdAt: doc.$createdAt,
                    }));
                }
            } catch (err) {
                console.warn("[ImageService] ⚠️ DB query failed, falling back to Storage:", err.message);
            }
        }

        // Fallback: list all bucket files
        try {
            const files = await storage.listFiles(APPWRITE_CONFIG.imagesBucketId);
            return (files.files ?? []).map(f => ({
                $id: f.$id,
                file_id: f.$id,
                image_url: buildViewUrl(f.$id),
                createdAt: f.$createdAt,
            }));
        } catch (err) {
            console.error("[ImageService] 🚨 Storage list also failed:", err.message);
            return [];
        }
    },
};
