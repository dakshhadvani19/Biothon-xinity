import { account } from '../appwrite/config';
import { OAuthProvider } from 'appwrite';

export const authService = {
    loginWithGoogle: () => {
        // Redirects to Google, then returns to /profile on success
        account.createOAuth2Session(
            OAuthProvider.Google,
            'http://localhost:5173/profile',
            'http://localhost:5173/'
        );
    },
    getCurrentUser: async () => {
        try {
            return await account.get();
        } catch (error) {
            return null; // Silent catch for unauthenticated users
        }
    },
    logout: async () => {
        try {
            await account.deleteSession('current');
            return true;
        } catch (error) {
            console.error("Logout failed", error);
            return false;
        }
    }
};
