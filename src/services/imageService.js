import { storage, APPWRITE_CONFIG } from '../api/appwrite';
import { ID } from 'appwrite';

export const imageService = {
    uploadCropImage: async (file) => {
        try {
            return await storage.createFile(
                APPWRITE_CONFIG.imagesBucketId,
                ID.unique(),
                file
            );
        } catch (error) {
            console.error("[ImageService] 🚨 Storage Error: Upload Image", error);
            throw error;
        }
    },
    
    getImageViewUrl: (fileId) => {
        try {
            return storage.getFileView(
                APPWRITE_CONFIG.imagesBucketId,
                fileId
            );
        } catch (error) {
            console.error("[ImageService] 🚨 Storage Error: Get Image URL", error);
            return null;
        }
    },
    
    deleteCropImage: async (fileId) => {
        try {
            await storage.deleteFile(
                APPWRITE_CONFIG.imagesBucketId,
                fileId
            );
            return true;
        } catch (error) {
            console.error("[ImageService] 🚨 Storage Error: Delete Image", error);
            throw error;
        }
    }
};
