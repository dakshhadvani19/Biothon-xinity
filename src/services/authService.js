import { account } from '../appwrite/config.js';
import { OAuthProvider } from 'appwrite';

/**
 * Initiates the Google OAuth2 login flow.
 * Appwrite handles the redirect to the provider natively.
 */
export async function loginWithGoogle() {
  try {
    account.createOAuth2Session(
      OAuthProvider.Google,
      'http://localhost:5173/profile',
      'http://localhost:5173/login-failed'
    );
  } catch (error) {
    console.error('[AuthService] 🚨 Security Error: Failed to initiate Google OAuth2 session', error);
    throw error;
  }
}

/**
 * Retrieves the currently authenticated user's session data.
 * Does not throw if no session exists, returns null for graceful degradation.
 * 
 * @returns {Promise<Object|null>} User object if authenticated, null otherwise.
 */
export async function getCurrentUser() {
  try {
    const user = await account.get();
    return user;
  } catch (error) {
    if (error.code !== 401) {
      console.error('[AuthService] ⚠️ Unexpected error verifying session state:', error);
    } else {
      // 401 just means no active session; log as info/debug rather than error
      console.info('[AuthService] ℹ️ No active user session detected (401).');
    }
    return null;
  }
}

/**
 * Logs out the current user by permanently destroying their active session token.
 * 
 * @returns {Promise<boolean>} true if successfully logged out, false otherwise.
 */
export async function logout() {
  try {
    await account.deleteSession('current');
    console.info('[AuthService] 🔒 User session successfully destroyed.');
    return true;
  } catch (error) {
    console.error('[AuthService] 🚨 Security Error: Failed to terminate active user session', error);
    return false;
  }
}
