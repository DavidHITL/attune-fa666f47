
import { Message } from "@/components/MessageBubble";
import { supabase } from "@/integrations/supabase/client";
import { testDatabaseAccess } from "../api/chatService";
import { MessageMetadata } from "@/hooks/useWebRTCConnection/types";

// Save message to database with explicit error handling for RLS policy issues
export const saveMessage = async (
  text: string, 
  isUser: boolean, 
  metadata: Partial<MessageMetadata> = { messageType: 'text' }
): Promise<string | null> => {
  try {
    // Check if the user is logged in
    const { data: { session } } = await supabase.auth.getSession();
    if (!session || !session.user || !session.user.id) {
      console.error("No valid session found when saving message");
      return null;
    }
    
    // First check if we can access the messages table
    const hasAccess = await testDatabaseAccess();
    if (!hasAccess) {
      // Log error about RLS issues
      console.error("Database access issue: Could not save message due to permissions");
      return null;
    }
    
    // Try to insert the message with explicit user_id set to current user
    const { data, error } = await supabase
      .from('messages')
      .insert({
        content: text,
        user_id: session.user.id,
        sender_type: isUser ? 'user' : 'bot',
        message_type: metadata.messageType === 'voice' ? 'voice' : 'text', // Ensure it's either 'voice' or 'text'
        instructions: metadata.instructions,
        knowledge_entries: metadata.knowledgeEntries || null
      })
      .select('id')
      .single();
    
    if (error) {
      console.error("Error saving message to database:", error);
      if (error.code === '42501' || error.message.includes('policy')) {
        console.error("Row Level Security (RLS) policy issue detected:", error.message);
      }
      return null;
    }
    
    console.log("Message saved successfully with ID:", data?.id);
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
    if (!session || !session.user) {
      console.error("No valid session found when fetching messages");
      return null;
    }

    // First test if we can access the messages table
    const hasAccess = await testDatabaseAccess();
    if (!hasAccess) {
      console.error("Database access issue: Could not fetch chat history");
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
        console.error("Row Level Security (RLS) policy issue detected:", error.message);
      }
      return null;
    }
    
    if (!data || data.length === 0) {
      console.log("No messages found in database");
      return null;
    }
    
    // Transform database messages to our app format
    const formattedMessages: Message[] = data.map(dbMessage => ({
      id: dbMessage.id.toString(),
      text: dbMessage.content || '',
      isUser: dbMessage.sender_type === 'user',
      timestamp: new Date(dbMessage.created_at),
      messageType: (dbMessage.message_type === 'voice' ? 'voice' : 'text') as 'text' | 'voice' // Ensure correct type
    }));
    
    console.log(`Fetched ${formattedMessages.length} messages from database`);
    return formattedMessages;
  } catch (error) {
    console.error("Failed to fetch messages:", error);
    return null;
  }
};

// Fetch messages with additional metadata for context enrichment
export const fetchMessagesWithMetadata = async (): Promise<any[] | null> => {
  try {
    // Check if the user is logged in
    const { data: { session } } = await supabase.auth.getSession();
    if (!session || !session.user) {
      console.error("No valid session found when fetching messages with metadata");
      return null;
    }

    const { data, error } = await supabase
      .from('messages')
      .select('id, content, sender_type, created_at, message_type, instructions, knowledge_entries')
      .eq('user_id', session.user.id)
      .order('created_at', { ascending: true });
    
    if (error) {
      console.error("Error fetching messages with metadata:", error);
      return null;
    }
    
    return data || null;
  } catch (error) {
    console.error("Failed to fetch messages with metadata:", error);
    return null;
  }
};
