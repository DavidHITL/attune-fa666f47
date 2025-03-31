
import { Message } from "@/components/MessageBubble";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { MessageMetadata } from "@/hooks/useWebRTCConnection/types";

export interface ChatMessage {
  role: string;
  content: string;
}

// Convert app messages to API format
export const convertMessagesToApiFormat = (messages: Message[]): ChatMessage[] => {
  // Filter out any empty, undefined messages or messages with invalid format
  const validMessages = messages.filter(msg => msg && msg.text && typeof msg.isUser === 'boolean');
  console.log(`Converting ${validMessages.length} messages to API format`);
  
  return validMessages.map(msg => ({
    role: msg.isUser ? "user" : "assistant",
    content: msg.text
  }));
};

// Generate a unique ID for messages
export const generateUniqueId = (): string => {
  return `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
};

// Create a message object
export const createMessageObject = (
  text: string, 
  isUser: boolean, 
  metadata: Partial<MessageMetadata> = {}
): Message => {
  return {
    id: generateUniqueId(),
    text,
    isUser,
    timestamp: new Date(),
    messageType: metadata.messageType || 'text'
  };
};

// Format conversation history for AI context
export const formatConversationHistory = (messages: Message[]): string => {
  return messages.map(msg => {
    const role = msg.isUser ? "User" : "Assistant";
    const type = msg.messageType === 'voice' ? "[Voice]" : "";
    return `${role}${type}: ${msg.text}`;
  }).join("\n\n");
};
