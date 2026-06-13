// src/api/appwrite.js
import { Client, Account, Databases, Storage } from 'appwrite';

// Initialize the Appwrite Client
const client = new Client();

client
    .setEndpoint(import.meta.env.VITE_APPWRITE_ENDPOINT)
    .setProject(import.meta.env.VITE_APPWRITE_PROJECT_ID);

// Export instances for the rest of your app to use
export const account = new Account(client);
export const databases = new Databases(client);
export const storage = new Storage(client);

// Export constants for clean imports in your Redux slices
export const APPWRITE_CONFIG = {
    databaseId: import.meta.env.VITE_APPWRITE_DATABASE_ID,
    logsCollectionId: import.meta.env.VITE_APPWRITE_LOGS_COLLECTION_ID,
    feedCollectionId: import.meta.env.VITE_APPWRITE_FEED_COLLECTION_ID,
    imagesBucketId: import.meta.env.VITE_APPWRITE_IMAGES_BUCKET_ID,
    userImagesCollectionId: import.meta.env.VITE_APPWRITE_USER_IMAGES_COLLECTION_ID,
    userAuthCollectionId: import.meta.env.VITE_APPWRITE_USER_AUTH_COLLECTION_ID,
    chatsCollectionId: import.meta.env.VITE_APPWRITE_CHATS_COLLECTION_ID,
    cropSuitabilityCollectionId: import.meta.env.VITE_APPWRITE_CROP_SUITABILITY_COLLECTION_ID,
    nutritionCollectionId: import.meta.env.VITE_APPWRITE_NUTRITION_COLLECTION_ID,
};

export default client;