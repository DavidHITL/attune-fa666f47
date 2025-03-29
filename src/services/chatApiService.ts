
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
  console.log("Conversation history length:", conversationHistory.length);
  
  try {
    // Check if the session is valid before making the request
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      console.error("No valid session found before API call");
      throw new Error("You need to be logged in to use the chat");
    }
    
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
  } catch (error) {
    console.error("Error in callChatApi:", error);
    throw error;
  }
};

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
