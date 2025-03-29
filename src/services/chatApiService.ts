
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

  if (!data || !data.success) {
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

// Create a message object
export const createMessageObject = (text: string, isUser: boolean): Message => {
  return {
    id: Date.now().toString(),
    text,
    isUser,
    timestamp: new Date()
  };
};
