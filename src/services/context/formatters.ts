
/**
 * Format chat history for the AI context window
 */
export const formatChatContext = (messages: any[]): string => {
  if (!messages || messages.length === 0) {
    return "";
  }
  
  // Extract only the most recent messages up to MAX_MESSAGE_COUNT
  import { MAX_MESSAGE_COUNT } from './types';
  const recentMessages = messages.slice(-MAX_MESSAGE_COUNT);
  
  return recentMessages.map(msg => {
    const role = msg.sender_type === 'user' ? 'User' : 'AI';
    const timestamp = new Date(msg.created_at).toLocaleString();
    return `[${timestamp}] ${role}: ${msg.content}`;
  }).join('\n\n');
};

/**
 * Format knowledge entries for the AI context window
 */
export const formatKnowledgeEntries = (entries: any[]): string => {
  if (!entries || entries.length === 0) {
    return "";
  }
  
  return `RELEVANT KNOWLEDGE:\n${entries.map((entry, index) => 
    `[${index + 1}] ${entry.title || 'Untitled'}: ${entry.content || entry.description || 'No content'}`
  ).join('\n\n')}`;
};
