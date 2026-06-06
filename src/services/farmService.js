import { databases } from '../appwrite/config';
import { ID, Query } from 'appwrite';

// Utilizing environment variables for robust configuration, falling back to placeholders
const DB_ID = import.meta.env.VITE_APPWRITE_DATABASE_ID || 'YOUR_DATABASE_ID';
const COL_ID = import.meta.env.VITE_APPWRITE_FARMS_COLLECTION_ID || 'YOUR_COLLECTION_ID';

export const farmService = {
    addFarmToDB: async (userId, crop, soil) => {
        try {
            if (DB_ID === 'YOUR_DATABASE_ID' || COL_ID === 'YOUR_COLLECTION_ID' || userId.startsWith('mock-')) {
                throw new Error("Using local storage fallback");
            }
            return await databases.createDocument(DB_ID, COL_ID, ID.unique(), {
                user_id: userId,
                crop: crop,
                soil: soil
            });
        } catch (error) {
            console.warn("[FarmService] 🚨 DB Error: Falling back to LocalStorage", error);
            const localFarms = JSON.parse(localStorage.getItem('agrishield_local_farms') || '[]');
            const newDoc = {
                $id: 'local-farm-' + Math.random().toString(36).substring(2, 9),
                user_id: userId,
                crop: crop,
                soil: soil
            };
            localFarms.push(newDoc);
            localStorage.setItem('agrishield_local_farms', JSON.stringify(localFarms));
            return newDoc;
        }
    },
    getUserFarms: async (userId) => {
        try {
            if (DB_ID === 'YOUR_DATABASE_ID' || COL_ID === 'YOUR_COLLECTION_ID' || userId.startsWith('mock-')) {
                throw new Error("Using local storage fallback");
            }
            const response = await databases.listDocuments(DB_ID, COL_ID, [
                Query.equal('user_id', userId)
            ]);
            return response.documents;
        } catch (error) {
            console.warn("[FarmService] 🚨 DB Error: Fetching from LocalStorage", error);
            const localFarms = JSON.parse(localStorage.getItem('agrishield_local_farms') || '[]');
            return localFarms.filter(f => f.user_id === userId);
        }
    },
    deleteFarmFromDB: async (farmId) => {
        try {
            if (farmId.startsWith('local-')) {
                throw new Error("Local farm deletion");
            }
            await databases.deleteDocument(DB_ID, COL_ID, farmId);
            return true;
        } catch (error) {
            console.warn("[FarmService] 🚨 Deleting from LocalStorage", error);
            const localFarms = JSON.parse(localStorage.getItem('agrishield_local_farms') || '[]');
            const updated = localFarms.filter(f => f.$id !== farmId);
            localStorage.setItem('agrishield_local_farms', JSON.stringify(updated));
            return true;
        }
    }
};
