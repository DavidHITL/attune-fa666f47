
// Re-export all chat services from their respective modules
import { callChatApi, testDatabaseAccess } from "./api/chatService";
import { convertMessagesToApiFormat, createMessageObject, generateUniqueId } from "./messages/messageUtils";
import { saveMessage, fetchMessagesFromDatabase } from "./messages/messageStorage";

// Export everything
export { 
  callChatApi,
  testDatabaseAccess,
  convertMessagesToApiFormat,
  createMessageObject,
  generateUniqueId,
  saveMessage,
  fetchMessagesFromDatabase
};

export type { ChatMessage } from "./messages/messageUtils";
