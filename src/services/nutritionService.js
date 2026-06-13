import { databases } from '../appwrite/config';
import { ID, Query } from 'appwrite';

const DB_ID = import.meta.env.VITE_APPWRITE_DATABASE_ID || '6a1d47b3002eaafca63b';
const COL_ID = import.meta.env.VITE_APPWRITE_NUTRITION_COLLECTION_ID || 'nutrition_analyses';
const LS_KEY = (userId) => `agrishield_nutrition_${userId}`;

function lsGet(userId) { return JSON.parse(localStorage.getItem(LS_KEY(userId)) || '[]'); }
function lsSet(userId, docs) { localStorage.setItem(LS_KEY(userId), JSON.stringify(docs)); }

export const nutritionService = {
    async saveResult(userId, cropName, imageId, result) {
        const crop = (cropName || result?.name || '').toLowerCase().trim();
        if (!crop) return null;
        const updated_at = new Date().toISOString();

        const benefits = (result.health_benefits || [])
            .slice(0, 5)
            .map(b => `${b.title || ''}: ${b.description || ''}`.slice(0, 500));

        const data = {
            user_id: userId,
            crop,
            image_id: imageId || '',
            calories: String(result.calories || ''),
            vitamins: (result.vitamins || []).slice(0, 20),
            minerals: (result.minerals || []).slice(0, 20),
            benefits,
            updated_at,
        };

        try {
            if (userId.startsWith('mock-')) throw new Error('mock');
            const existing = await databases.listDocuments(DB_ID, COL_ID, [
                Query.equal('user_id', userId),
                Query.equal('crop', crop),
                Query.limit(1),
            ]);
            if (existing.documents.length > 0) {
                return await databases.updateDocument(DB_ID, COL_ID, existing.documents[0].$id, data);
            }
            return await databases.createDocument(DB_ID, COL_ID, ID.unique(), data);
        } catch {
            const docs = lsGet(userId).filter(d => d.crop !== crop);
            const newDoc = { $id: 'local-nutri-' + Math.random().toString(36).slice(2, 9), ...data };
            lsSet(userId, [newDoc, ...docs]);
            return newDoc;
        }
    },

    async getByUser(userId) {
        try {
            if (userId.startsWith('mock-')) throw new Error('mock');
            const res = await databases.listDocuments(DB_ID, COL_ID, [
                Query.equal('user_id', userId),
                Query.orderDesc('updated_at'),
                Query.limit(100),
            ]);
            return res.documents;
        } catch {
            return lsGet(userId).sort((a, b) => new Date(b.updated_at) - new Date(a.updated_at));
        }
    },

    async getByCrop(userId, cropLower) {
        try {
            if (userId.startsWith('mock-')) throw new Error('mock');
            const res = await databases.listDocuments(DB_ID, COL_ID, [
                Query.equal('user_id', userId),
                Query.equal('crop', cropLower),
                Query.limit(1),
            ]);
            return res.documents[0] || null;
        } catch {
            return lsGet(userId).find(d => d.crop === cropLower) || null;
        }
    },
};
