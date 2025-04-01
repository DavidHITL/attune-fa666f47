import { Message } from "@/components/MessageBubble";
import { supabase } from "@/integrations/supabase/client";
import { MessageMetadata } from "@/hooks/useWebRTCConnection/types";

export interface ChatMessage {
  role: string;
  content: string;
}

// Function to convert messages to the format expected by the API
export const convertMessagesToApiFormat = (messages: Message[]): ChatMessage[] => {
  return messages.map(message => ({
    role: message.isUser ? "user" : "assistant",
    content: message.text
  }));
};

// Function to create a message object
export const createMessageObject = (
  text: string,
  isUser: boolean,
  metadata: Partial<MessageMetadata> = { messageType: 'text' }
): Message => {
  return {
    id: Math.random().toString(36).substring(2, 15), // Generate a random ID
    text: text,
    isUser: isUser,
    timestamp: new Date(),
    messageType: (metadata.messageType === 'voice' ? 'voice' : 'text') // Ensure it's either 'voice' or 'text'
  };
};

// Function to save a message to the database
export const saveMessage = async (
  text: string, 
  isUser: boolean,
  metadata: Partial<MessageMetadata> = { messageType: 'text' }
): Promise<string | null> => {
  try {
    // Get current user from session
    const { data: { session } } = await supabase.auth.getSession();
    const userId = session?.user?.id;
    
    if (!userId) {
      console.error("No user ID found, cannot save message");
      return null;
    }

    const { data, error } = await supabase
      .from('messages')
      .insert([
        {
          user_id: userId,
          content: text,
          sender_type: isUser ? 'user' : 'bot',
          message_type: metadata.messageType === 'voice' ? 'voice' : 'text', // Ensure it's either 'voice' or 'text'
          instructions: metadata.instructions,
          knowledge_entries: metadata.knowledgeEntries
        },
      ])
      .select('id') // Only select the ID
      .single(); // Expect a single result

    if (error) {
      console.error("Error saving message:", error);
      throw error;
    }

    // Check if data and data.id exist before returning
    if (data && data.id) {
      return data.id.toString(); // Return the ID of the new message
    } else {
      console.error("No message ID returned after saving");
      return null;
    }
  } catch (error) {
    console.error("Error saving message:", error);
    return null;
  }
};

// Function to fetch messages from the database
export const fetchMessagesFromDatabase = async (): Promise<Message[] | null> => {
  try {
    // Get current user from session
    const { data: { session } } = await supabase.auth.getSession();
    const userId = session?.user?.id;
    
    if (!userId) {
      console.log("No user ID found, not fetching messages");
      return null;
    }

    const { data, error } = await supabase
      .from('messages')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: true });

    if (error) {
      console.error("Error fetching messages:", error);
      throw error;
    }

    if (!data || data.length === 0) {
      console.log("No messages found for user:", userId);
      return null;
    }

    // Convert database messages to the Message interface
    const messages: Message[] = data.map(msg => ({
      id: msg.id.toString(),
      text: msg.content || '', // Map content to text
      isUser: msg.sender_type === 'user', // Map sender_type to isUser
      timestamp: new Date(msg.created_at),
      messageType: (msg.message_type === 'voice' ? 'voice' : 'text') as 'text' | 'voice' // Ensure correct type
    }));

    return messages;
  } catch (error) {
    console.error("Error fetching messages:", error);
    return null;
  }
};

// Function to call the Supabase Edge Function for chat
export const callChatApi = async (
  message: string, 
  conversationHistory: ChatMessage[] = [], 
  sessionProgress: number = 0,
  metadata: Partial<MessageMetadata> = {}
) => {
  try {
    console.log(`Calling Supabase Edge Function with ${conversationHistory.length} messages`);
    
    const { data, error } = await supabase.functions.invoke('generateChatResponse', {
      body: { 
        message, 
        conversationHistory,
        sessionProgress,
        metadata
      }
    });

    if (error) {
      console.error('Error calling Supabase Edge Function:', error);
      throw new Error(`Supabase function error: ${error.message}`);
    }

    if (!data?.success) {
      console.error('Chat API returned an error:', data?.error || 'Unknown error');
      throw new Error(data?.error || 'Failed to get a response from the AI service');
    }

    return data.reply;
  } catch (error) {
    console.error('Error in callChatApi:', error);
    throw error;
  }
}

// Function to trigger user message analysis
export const triggerUserAnalysis = async (userId: string): Promise<boolean> => {
  try {
    if (!userId) {
      console.error("No user ID provided for analysis");
      return false;
    }
    
    // Add an entry to the analysis_queue table
    const { error } = await supabase
      .from('analysis_queue')
      .insert([{ user_id: userId }]);
      
    if (error) {
      console.error("Error queueing user analysis:", error);
      return false;
    }
    
    return true;
  } catch (error) {
    console.error("Error triggering user analysis:", error);
    return false;
  }
};
