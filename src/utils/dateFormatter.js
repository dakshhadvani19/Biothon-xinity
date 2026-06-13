/**
 * FAANG-level Date Formatter using native Javascript APIs
 * Accurately groups chat items into human-readable date categories.
 */
export const groupChatsByDate = (chats) => {
  if (!chats || chats.length === 0) return [];

  // Initialize standard chronological groups
  const groups = {
    'Today': [],
    'Yesterday': [],
    'Previous 7 Days': [],
    'Previous 30 Days': [],
  };

  const now = new Date();
  
  // Normalize 'today' to 00:00:00 local time to prevent 
  // false categorization for late-night chats vs early morning chats
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  const msInDay = 24 * 60 * 60 * 1000;

  chats.forEach(chat => {
    // Graceful fallback if timestamp is missing
    const dateStr = chat.updated_at || chat.$createdAt;
    if (!dateStr) return; 

    const chatDate = new Date(dateStr);
    
    // Normalize chat to its local midnight for strict day diffing
    const chatStart = new Date(chatDate.getFullYear(), chatDate.getMonth(), chatDate.getDate()).getTime();
    
    // Calculate the difference in whole days
    const diffDays = Math.round((todayStart - chatStart) / msInDay);

    if (diffDays === 0) {
      groups['Today'].push(chat);
    } else if (diffDays === 1) {
      groups['Yesterday'].push(chat);
    } else if (diffDays <= 7) {
      groups['Previous 7 Days'].push(chat);
    } else if (diffDays <= 30) {
      groups['Previous 30 Days'].push(chat);
    } else {
      // For older chats, group them dynamically by "Month Year" (e.g. "March 2024")
      // Using native Intl.DateTimeFormat for zero-dependency FAANG-level localization
      const formatter = new Intl.DateTimeFormat('en-US', { month: 'long', year: 'numeric' });
      const monthYear = formatter.format(chatDate);
      
      if (!groups[monthYear]) {
        groups[monthYear] = [];
      }
      groups[monthYear].push(chat);
    }
  });

  // Filter out any empty groups and return as an array of [groupName, chatsArray] tuples
  // Object.entries inherently preserves the insertion order which works perfectly since 
  // 'Today', 'Yesterday', etc. were inserted first in the initialization.
  return Object.entries(groups).filter(([_, items]) => items.length > 0);
};
