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
};

export default client;