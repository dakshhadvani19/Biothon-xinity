import { account, databases, APPWRITE_CONFIG } from '../api/appwrite';
import { OAuthProvider, Query, ID } from 'appwrite';

export const authService = {
    loginWithGoogle: () => {
        if (import.meta.env.VITE_APPWRITE_PROJECT_ID === "dummy_project_id") {
            // Automatically switch to mock login to avoid redirecting to a broken Appwrite URL
            authService.loginMock();
            return;
        }
        // Redirects to Google, then returns to / on success
        account.createOAuth2Session(
            OAuthProvider.Google,
            window.location.origin + '/',
            window.location.origin + '/'
        );
    },
    loginMock: () => {
        const mockUser = {
            $id: 'mock-user-123',
            name: 'Demo Farmer',
            email: 'farmer@agrishield.org'
        };
        localStorage.setItem('agrishield_mock_user', JSON.stringify(mockUser));
        window.location.reload();
    },

    syncUserToDatabase: async (user) => {
        // Guard: skip entirely if collection is not configured
        if (!APPWRITE_CONFIG.userAuthCollectionId) return;
        try {
            try {
                await databases.getDocument(
                    APPWRITE_CONFIG.databaseId,
                    APPWRITE_CONFIG.userAuthCollectionId,
                    user.$id
                );
                // Document exists, nothing to do
            } catch (err) {
                if (err?.code === 404) {
                    // Document doesn't exist — create it
                    await databases.createDocument(
                        APPWRITE_CONFIG.databaseId,
                        APPWRITE_CONFIG.userAuthCollectionId,
                        user.$id,
                        { email_id: user.email }  // attribute is "email_id" in Appwrite schema
                    );
                }
                // Any other error (collection not found etc.) is swallowed below
            }
        } catch (error) {
            // Non-critical — don't block authentication
            console.warn("[AuthService] ⚠️ user_auth sync skipped:", error?.message);
        }
    },
    getCurrentUser: async () => {
        const mockUser = localStorage.getItem('agrishield_mock_user');
        if (mockUser) {
            return JSON.parse(mockUser);
        }
        if (import.meta.env.VITE_APPWRITE_PROJECT_ID === "dummy_project_id") {
            return null; // Avoid making a broken network request to cloud.appwrite.io
        }
        try {
            const user = await account.get();
            if (user) {
                // Ensure their details are synced to the new user_auth table
                await authService.syncUserToDatabase(user);
            }
            return user;
        } catch (error) {
            return null; // Silent catch for unauthenticated users
        }
    },
    
    logout: async () => {
        localStorage.removeItem('agrishield_mock_user');
        try {
            await account.deleteSession('current');
            return true;
        } catch (error) {
            console.error("Logout failed", error);
            return false;
        }
    }
};
