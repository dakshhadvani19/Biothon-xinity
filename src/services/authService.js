import { account } from '../appwrite/config';
import { OAuthProvider } from 'appwrite';

export const authService = {
    loginWithGoogle: () => {
        if (import.meta.env.VITE_APPWRITE_PROJECT_ID === "dummy_project_id") {
            // Automatically switch to mock login to avoid redirecting to a broken Appwrite URL
            authService.loginMock();
            return;
        }
        // Redirects to Google, then returns to /profile on success
        account.createOAuth2Session(
            OAuthProvider.Google,
            'http://localhost:5173/profile',
            'http://localhost:5173/'
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
    getCurrentUser: async () => {
        const mockUser = localStorage.getItem('agrishield_mock_user');
        if (mockUser) {
            return JSON.parse(mockUser);
        }
        if (import.meta.env.VITE_APPWRITE_PROJECT_ID === "dummy_project_id") {
            return null; // Avoid making a broken network request to cloud.appwrite.io
        }
        try {
            return await account.get();
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
