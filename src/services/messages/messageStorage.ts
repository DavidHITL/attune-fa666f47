
import { supabase } from "@/integrations/supabase/client";
import { Message } from "@/components/MessageBubble";
import { createMessageObject } from "./messageUtils";

/**
 * Save a message to the database
 */
export const saveMessage = async (text: string, isUser: boolean, metadata: any = {}) => {
  try {
    // Get current user session
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session?.user) {
      console.error("Cannot save message: No authenticated user");
      return null;
    }
    
    const { messageType = 'text', instructions, knowledgeEntries } = metadata;
    
    const newMessage = {
      user_id: session.user.id,
      content: text,
      sender_type: isUser ? 'user' : 'assistant',
      message_type: messageType,
      instructions,
      knowledge_entries: knowledgeEntries
    };
    
    // Insert the message
    const { data, error } = await supabase
      .from('messages')
      .insert(newMessage)
      .select()
      .single();
    
    if (error) {
      console.error("Error saving message:", error);
      return null;
    }
    
    return data.id;
  } catch (error) {
    console.error("Error in saveMessage:", error);
    return null;
  }
};

/**
 * Fetch messages for the current user from the database
 */
export const fetchMessages = async () => {
  try {
    // Get current user session
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session?.user) {
      console.error("Cannot fetch messages: No authenticated user");
      return null;
    }
    
    // Get messages for this user
    const { data, error } = await supabase
      .from('messages')
      .select('*')
      .eq('user_id', session.user.id)
      .order('created_at', { ascending: true });
    
    if (error) {
      console.error("Error fetching messages:", error);
      return null;
    }
    
    return data;
  } catch (error) {
    console.error("Error in fetchMessages:", error);
    return null;
  }
};

/**
 * Convert database messages to UI message format
 */
export const convertToMessageObjects = (messages: any[]): Message[] => {
  if (!messages || !Array.isArray(messages)) {
    return [];
  }
  
  return messages.map(msg => {
    // Create message object with just the essential parameters
    // The createMessageObject function should handle only what it needs
    return createMessageObject(
      msg.content,
      msg.sender_type === 'user',
      {
        messageType: msg.message_type || 'text'
      }
    );
  });
};

/**
 * Fetch messages with metadata for context enrichment
 * @param userId Optional user ID, will try to get from session if not provided
 */
export const fetchMessagesWithMetadata = async (userId?: string) => {
  try {
    // If no userId provided, try to get from session
    if (!userId) {
      const { data: { session } } = await supabase.auth.getSession();
      userId = session?.user?.id;
      
      if (!userId) {
        console.log("No active user session found");
        return null;
      }
    }
    
    console.log(`[messageStorage] Fetching messages with metadata for user: ${userId}`);
    
    const { data, error } = await supabase
      .from('messages')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(30);
    
    if (error) {
      console.error("[messageStorage] Error fetching messages with metadata:", error);
      return null;
    }
    
    console.log(`[messageStorage] Fetched ${data.length} messages with metadata`);
    return data;
  } catch (error) {
    console.error("[messageStorage] Error in fetchMessagesWithMetadata:", error);
    return null;
  }
};
