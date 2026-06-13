import { databases } from '../appwrite/config';
import { ID, Query } from 'appwrite';

const DB_ID = import.meta.env.VITE_APPWRITE_DATABASE_ID || '6a1d47b3002eaafca63b';
const COL_ID = import.meta.env.VITE_APPWRITE_CHATS_COLLECTION_ID || 'chats';
const LS_KEY = (userId) => `agrishield_chats_${userId}`;

// ── Serialization helpers ─────────────────────────────────────────────────────

export function serializeMessages(messages) {
    return messages
        .filter(m => !m.isWelcome)
        .map(m => JSON.stringify({ role: m.role, content: m.content, content_hi: m.content_hi || '' }));
}

export function deserializeMessages(arr) {
    if (!Array.isArray(arr)) return [];
    return arr.map(s => {
        try { return JSON.parse(s); } catch { return null; }
    }).filter(Boolean);
}

// ── Date/time helpers ─────────────────────────────────────────────────────────

export function formatChatDate(isoString) {
    const date = new Date(isoString);
    const now = new Date();
    const diffDays = Math.floor((now - date) / 86_400_000);

    if (diffDays === 0) {
        return new Intl.DateTimeFormat('en-IN', { hour: 'numeric', minute: '2-digit', hour12: true }).format(date);
    }
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) {
        return new Intl.DateTimeFormat('en-IN', { weekday: 'short' }).format(date);
    }
    if (date.getFullYear() === now.getFullYear()) {
        return new Intl.DateTimeFormat('en-IN', { month: 'short', day: 'numeric' }).format(date);
    }
    return new Intl.DateTimeFormat('en-IN', { month: 'short', day: 'numeric', year: 'numeric' }).format(date);
}

// ── Local storage fallback (mock users / offline) ─────────────────────────────

function lsGetChats(userId) {
    return JSON.parse(localStorage.getItem(LS_KEY(userId)) || '[]');
}
function lsSaveChats(userId, chats) {
    localStorage.setItem(LS_KEY(userId), JSON.stringify(chats));
}

// ── Chat service ──────────────────────────────────────────────────────────────

export const chatService = {
    async createChat(userId, firstMessage, serializedMessages) {
        const title = firstMessage.trim().slice(0, 60) + (firstMessage.trim().length > 60 ? '...' : '');
        const updated_at = new Date().toISOString();

        try {
            if (userId.startsWith('mock-')) throw new Error('mock');
            const doc = await databases.createDocument(DB_ID, COL_ID, ID.unique(), {
                user_id: userId,
                title,
                messages: serializedMessages,
                updated_at,
            });
            return doc;
        } catch {
            const chats = lsGetChats(userId);
            const newChat = { $id: 'local-chat-' + Math.random().toString(36).slice(2, 9), user_id: userId, title, messages: serializedMessages, updated_at };
            lsSaveChats(userId, [newChat, ...chats]);
            return newChat;
        }
    },

    async updateChat(chatId, serializedMessages) {
        const updated_at = new Date().toISOString();
        try {
            if (chatId.startsWith('local-')) throw new Error('local');
            await databases.updateDocument(DB_ID, COL_ID, chatId, { messages: serializedMessages, updated_at });
            return updated_at;
        } catch {
            // find which userId owns this chat by scanning all LS keys
            for (const key of Object.keys(localStorage)) {
                if (!key.startsWith('agrishield_chats_')) continue;
                const userId = key.replace('agrishield_chats_', '');
                const chats = lsGetChats(userId);
                const idx = chats.findIndex(c => c.$id === chatId);
                if (idx !== -1) {
                    chats[idx] = { ...chats[idx], messages: serializedMessages, updated_at };
                    lsSaveChats(userId, chats);
                    break;
                }
            }
            return updated_at;
        }
    },

    async getChat(chatId) {
        try {
            if (chatId.startsWith('local-')) throw new Error('local');
            return await databases.getDocument(DB_ID, COL_ID, chatId);
        } catch {
            for (const key of Object.keys(localStorage)) {
                if (!key.startsWith('agrishield_chats_')) continue;
                const userId = key.replace('agrishield_chats_', '');
                const chats = lsGetChats(userId);
                const found = chats.find(c => c.$id === chatId);
                if (found) return found;
            }
            return null;
        }
    },

    async getUserChats(userId) {
        try {
            if (userId.startsWith('mock-')) throw new Error('mock');
            const res = await databases.listDocuments(DB_ID, COL_ID, [
                Query.equal('user_id', userId),
                Query.orderDesc('updated_at'),
                Query.limit(100),
            ]);
            return res.documents;
        } catch {
            return lsGetChats(userId).sort((a, b) => new Date(b.updated_at) - new Date(a.updated_at));
        }
    },

    async deleteChat(chatId) {
        try {
            if (chatId.startsWith('local-')) throw new Error('local');
            await databases.deleteDocument(DB_ID, COL_ID, chatId);
        } catch {
            for (const key of Object.keys(localStorage)) {
                if (!key.startsWith('agrishield_chats_')) continue;
                const userId = key.replace('agrishield_chats_', '');
                const chats = lsGetChats(userId);
                if (chats.some(c => c.$id === chatId)) {
                    lsSaveChats(userId, chats.filter(c => c.$id !== chatId));
                    break;
                }
            }
        }
    },
};
