
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

// Save message directly to database
export const saveMessage = async (text: string, isUser: boolean): Promise<string | null> => {
  try {
    // Check if the user is logged in
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      console.error("No valid session found when saving message");
      return null;
    }
    
    const { data, error } = await supabase
      .from('messages')
      .insert({
        content: text,
        user_id: session.user.id,
        sender_type: isUser ? 'user' : 'bot'
      })
      .select('id')
      .single();
    
    if (error) {
      console.error("Error saving message to database:", error);
      if (error.code === '42501' || error.message.includes('policy')) {
        console.error("This appears to be a Row Level Security (RLS) policy issue");
      }
      return null;
    }
    
    return data?.id?.toString() || null;
  } catch (error) {
    console.error("Failed to save message:", error);
    return null;
  }
};

// Fetch messages directly from the database
export const fetchMessagesFromDatabase = async (): Promise<Message[] | null> => {
  try {
    // Check if the user is logged in
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      console.error("No valid session found when fetching messages");
      return null;
    }

    const { data, error } = await supabase
      .from('messages')
      .select('*')
      .eq('user_id', session.user.id)
      .order('created_at', { ascending: true });
    
    if (error) {
      console.error("Error fetching messages:", error);
      if (error.code === '42501' || error.message.includes('policy')) {
        console.error("This appears to be a Row Level Security (RLS) policy issue");
      }
      return null;
    }
    
    if (!data || data.length === 0) {
      return null;
    }
    
    // Transform database messages to our app format
    const formattedMessages: Message[] = data.map(dbMessage => ({
      id: dbMessage.id.toString(),
      text: dbMessage.content || '',
      isUser: dbMessage.sender_type === 'user',
      timestamp: new Date(dbMessage.created_at)
    }));
    
    console.log(`Fetched ${formattedMessages.length} messages from database`);
    return formattedMessages;
  } catch (error) {
    console.error("Failed to fetch messages:", error);
    return null;
  }
};
