import { databases, APPWRITE_CONFIG } from '../api/appwrite';
import { ID, Query } from 'appwrite';

const DB_ID = APPWRITE_CONFIG.databaseId;
const COL_ID = APPWRITE_CONFIG.chatsCollectionId || 'chats';

export const chatHistoryService = {
  /**
   * Create a new chat session in the database
   */
  createChat: async (userId, title, initialMessages) => {
    try {
      if (!userId) throw new Error("User ID is required");
      
      // We serialize the message objects to strings because Appwrite 
      // doesn't support array of objects natively in a simple way.
      const serializedMessages = initialMessages.map(msg => JSON.stringify(msg));
      
      const data = {
        user_id: userId,
        title: title.length > 40 ? title.substring(0, 40) + '...' : title,
        messages: serializedMessages,
        updated_at: new Date().toISOString()
      };
      
      return await databases.createDocument(DB_ID, COL_ID, ID.unique(), data);
    } catch (error) {
      console.error("[ChatHistoryService] Create Error:", error);
      throw error;
    }
  },

  /**
   * Overwrite the messages array for an existing chat session
   */
  updateChat: async (chatId, allMessages) => {
    try {
      if (!chatId) throw new Error("Chat ID is required");

      const serializedMessages = allMessages.map(msg => JSON.stringify(msg));
      
      const data = {
        messages: serializedMessages,
        updated_at: new Date().toISOString()
      };
      
      return await databases.updateDocument(DB_ID, COL_ID, chatId, data);
    } catch (error) {
      console.error("[ChatHistoryService] Update Error:", error);
      throw error;
    }
  },

  /**
   * Fetch all chat sessions for a specific user
   */
  getUserChats: async (userId) => {
    try {
      if (!userId) return [];

      const response = await databases.listDocuments(DB_ID, COL_ID, [
        Query.equal('user_id', userId),
        Query.limit(100)
      ]);
      
      // Sort natively in JavaScript to prevent Appwrite index strictness errors
      return response.documents.sort((a, b) => new Date(b.updated_at) - new Date(a.updated_at));
    } catch (error) {
      console.error("[ChatHistoryService] Fetch Error:", error);
      return [];
    }
  },

  /**
   * Delete a specific chat session
   */
  deleteChat: async (chatId) => {
    try {
      if (!chatId) throw new Error("Chat ID is required");
      await databases.deleteDocument(DB_ID, COL_ID, chatId);
      return true;
    } catch (error) {
      console.error("[ChatHistoryService] Delete Error:", error);
      throw error;
    }
  }
};
