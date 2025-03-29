
import { supabase } from "@/integrations/supabase/client";
import { Message } from "@/components/MessageBubble";
import { toast } from "@/hooks/use-toast";
import { generateLocalResponse } from "@/utils/localResponseGenerator";

interface ChatMessage {
  role: string;
  content: string;
}

// Function to call the Supabase Edge Function
export const callChatApi = async (
  message: string,
  conversationHistory: ChatMessage[]
): Promise<string> => {
  console.log("Calling generateChatResponse function");

  const { data, error } = await supabase.functions.invoke('generateChatResponse', {
    body: {
      message,
      conversationHistory
    }
  });

  if (error) {
    console.error("Supabase Function Error:", error);
    throw new Error(`Error calling function: ${error.message}`);
  }

  if (!data) {
    throw new Error("No response data received");
  }
  
  if (!data.success) {
    throw new Error(data?.error || "Failed to get response");
  }

  return data.reply;
};

// Convert app messages to API format
export const convertMessagesToApiFormat = (messages: Message[]): ChatMessage[] => {
  return messages.map(msg => ({
    role: msg.isUser ? "user" : "assistant",
    content: msg.text
  }));
};

// Generate a unique ID for messages
// Uses timestamp + random value to ensure uniqueness even in the same millisecond
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
