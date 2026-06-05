import { databases, APPWRITE_CONFIG } from '../api/appwrite';
import { ID, Query } from 'appwrite';

export const feedService = {
    createFeedPost: async (userId, authorName, title, content, location, imageId = null) => {
        try {
            return await databases.createDocument(
                APPWRITE_CONFIG.databaseId,
                APPWRITE_CONFIG.feedCollectionId,
                ID.unique(),
                {
                    user_id: userId,
                    author_name: authorName,
                    title: title,
                    content: content,
                    location: location,
                    image_id: imageId,
                    timestamp: new Date().toISOString()
                }
            );
        } catch (error) {
            console.error("[FeedService] 🚨 DB Error: Create Post", error);
            throw error;
        }
    },
    
    getRegionalFeed: async () => {
        try {
            const response = await databases.listDocuments(
                APPWRITE_CONFIG.databaseId,
                APPWRITE_CONFIG.feedCollectionId,
                [
                    Query.orderDesc('timestamp'),
                    Query.limit(50)
                ]
            );
            return response.documents;
        } catch (error) {
            console.error("[FeedService] 🚨 DB Error: Fetch Feed", error);
            return [];
        }
    },
    
    deleteFeedPost: async (postId) => {
        try {
            await databases.deleteDocument(
                APPWRITE_CONFIG.databaseId,
                APPWRITE_CONFIG.feedCollectionId,
                postId
            );
            return true;
        } catch (error) {
            console.error("[FeedService] 🚨 DB Error: Delete Post", error);
            throw error;
        }
    }
};
