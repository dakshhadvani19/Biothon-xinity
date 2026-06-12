import { databases, APPWRITE_CONFIG } from '../api/appwrite';
import { ID, Query } from 'appwrite';

export const diagnosticService = {
    saveDiagnosticLog: async (userId, farmId, disease, confidence, imageId) => {
        try {
            return await databases.createDocument(
                APPWRITE_CONFIG.databaseId,
                APPWRITE_CONFIG.logsCollectionId,
                ID.unique(),
                {
                    user_id: userId,
                    farm_id: farmId,
                    disease: disease,
                    confidence: confidence,
                    image_id: imageId,
                    timestamp: new Date().toISOString()
                }
            );
        } catch (error) {
            console.error("[DiagnosticService] 🚨 DB Error: Save Log", error);
            throw error;
        }
    },
    
    getUserDiagnosticLogs: async (userId) => {
        try {
            const response = await databases.listDocuments(
                APPWRITE_CONFIG.databaseId,
                APPWRITE_CONFIG.logsCollectionId,
                [
                    Query.equal('user_id', userId)
                ]
            );
            return response.documents.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
        } catch (error) {
            console.error("[DiagnosticService] 🚨 DB Error: Fetch Logs", error);
            return [];
        }
    },
    
    deleteDiagnosticLog: async (logId) => {
        try {
            await databases.deleteDocument(
                APPWRITE_CONFIG.databaseId,
                APPWRITE_CONFIG.logsCollectionId,
                logId
            );
            return true;
        } catch (error) {
            console.error("[DiagnosticService] 🚨 DB Error: Delete Log", error);
            throw error;
        }
    }
};
