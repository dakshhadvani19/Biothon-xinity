import { databases } from '../appwrite/config';
import { ID, Query } from 'appwrite';

// Utilizing environment variables for robust configuration, falling back to placeholders
const DB_ID = import.meta.env.VITE_APPWRITE_DATABASE_ID || 'YOUR_DATABASE_ID';
const COL_ID = import.meta.env.VITE_APPWRITE_FARMS_COLLECTION_ID || 'YOUR_COLLECTION_ID';

export const farmService = {
    addFarmToDB: async (userId, crop, soil) => {
        try {
            return await databases.createDocument(DB_ID, COL_ID, ID.unique(), {
                user_id: userId,
                crop: crop,
                soil: soil
            });
        } catch (error) {
            console.error("[FarmService] 🚨 DB Error: Add Farm", error);
            throw error;
        }
    },
    getUserFarms: async (userId) => {
        try {
            const response = await databases.listDocuments(DB_ID, COL_ID, [
                Query.equal('user_id', userId)
            ]);
            return response.documents;
        } catch (error) {
            console.error("[FarmService] 🚨 DB Error: Fetch Farms", error);
            return [];
        }
    },
    deleteFarmFromDB: async (farmId) => {
        try {
            await databases.deleteDocument(DB_ID, COL_ID, farmId);
            return true;
        } catch (error) {
            console.error("[FarmService] 🚨 DB Error: Delete Farm", error);
            throw error;
        }
    }
};
