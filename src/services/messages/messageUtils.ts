
import { Message } from "@/components/MessageBubble";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

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
export const createMessageObject = (text: string, isUser: boolean): Message => {
  return {
    id: generateUniqueId(),
    text,
    isUser,
    timestamp: new Date()
  };
};
