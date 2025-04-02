
import { supabase } from "@/integrations/supabase/client";
import { Message } from "@/components/MessageBubble";
import { MessageMetadata } from "./messageUtils";
import { Json } from "@/integrations/supabase/types";

/**
 * Save a message to the database
 */
export async function saveMessage(
  text: string, 
  isUser: boolean, 
  metadata?: Partial<MessageMetadata>
): Promise<string | null> {
  try {
    const { data: sessionData } = await supabase.auth.getSession();
    
    if (!sessionData?.session?.user) {
      console.error("Cannot save message: No authenticated user");
      throw new Error("Authentication required to save messages");
    }
    
    const user = sessionData.session.user;
    
    // Format any metadata for database storage
    const formattedMetadata = {
      message_type: metadata?.messageType || 'text',
      instructions: metadata?.instructions || null,
      knowledge_entries: metadata?.knowledgeEntries ? JSON.stringify(metadata.knowledgeEntries) : null,
    };
    
    // Insert the message into the database
    const { data, error } = await supabase
      .from('messages')
      .insert({
        content: text,
        user_id: user.id,
        sender_type: isUser ? 'user' : 'assistant',
        message_type: formattedMetadata.message_type,
        instructions: formattedMetadata.instructions,
        knowledge_entries: formattedMetadata.knowledge_entries as Json
      })
      .select('id')
      .single();
      
    if (error) {
      console.error("Error saving message:", error);
      return null;
    }
    
    console.log(`Message saved with ID: ${data.id}`);
    return data.id.toString();
  } catch (err) {
    console.error("Error in saveMessage:", err);
    return null;
  }
}

/**
 * Alias for fetchMessagesFromDatabase for backward compatibility
 */
export const fetchMessagesWithMetadata = fetchMessagesFromDatabase;

/**
 * Fetch messages from the database for the current user
 */
export async function fetchMessagesFromDatabase(userId?: string): Promise<Message[]> {
  try {
    // If userId is not provided, get it from the current session
    if (!userId) {
      const { data: sessionData } = await supabase.auth.getSession();
      
      if (!sessionData?.session?.user) {
        console.error("Cannot fetch messages: No authenticated user");
        return [];
      }
      
      userId = sessionData.session.user.id;
    }
    
    // Fetch messages from the database
    const { data, error } = await supabase
      .from('messages')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: true })
      .limit(100);
      
    if (error) {
      console.error("Error fetching messages:", error);
      return [];
    }
    
    if (!data || data.length === 0) {
      return [];
    }
    
    // Convert database messages to app Message format
    const messages: Message[] = data.map(msg => {
      // Determine if the message is from the user or the assistant
      const isUser = msg.sender_type === 'user';
      
      // Parse JSON knowledge entries if they exist
      let knowledgeEntries: any[] = [];
      if (msg.knowledge_entries) {
        try {
          if (typeof msg.knowledge_entries === 'string') {
            knowledgeEntries = JSON.parse(msg.knowledge_entries);
          } else if (Array.isArray(msg.knowledge_entries)) {
            knowledgeEntries = msg.knowledge_entries;
          }
        } catch (e) {
          console.warn("Could not parse knowledge entries:", e);
        }
      }
      
      return {
        id: msg.id.toString(),
        text: msg.content,
        isUser: isUser,
        timestamp: new Date(msg.created_at),
        messageType: (msg.message_type || 'text') as 'text' | 'voice' | 'system',
        instructions: msg.instructions || undefined,
        knowledgeEntries: knowledgeEntries
      };
    });
    
    return messages;
  } catch (err) {
    console.error("Error in fetchMessagesFromDatabase:", err);
    return [];
  }
}
