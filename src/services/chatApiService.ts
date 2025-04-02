
import { supabase } from "@/integrations/supabase/client";
import { Message } from "@/components/MessageBubble";
import { Json } from "@/integrations/supabase/types";

// Export the functions that were previously exported
export { saveMessage, fetchMessagesFromDatabase } from "./messages/messageStorage";

/**
 * Fetch messages for the current user 
 * @deprecated Use fetchMessagesFromDatabase from messageStorage.ts instead
 */
export async function fetchMessages(): Promise<Message[]> {
  try {
    const { data: sessionData } = await supabase.auth.getSession();
    
    if (!sessionData?.session?.user) {
      console.error("No authenticated user found");
      return [];
    }
    
    const { data, error } = await supabase
      .from('messages')
      .select('*')
      .eq('user_id', sessionData.session.user.id)
      .order('created_at', { ascending: true });
      
    if (error) {
      console.error("Error fetching messages:", error);
      return [];
    }
    
    if (!data || data.length === 0) {
      return [];
    }
    
    const messages: Message[] = data.map(msg => {
      // Determine if the message is from the user based on sender_type field
      const isUser = msg.sender_type === 'user';
      
      // Parse knowledge entries if they exist
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
        id: msg.id.toString(), // Convert to string for compatibility
        text: msg.content, // Map content to text
        isUser: isUser,
        timestamp: new Date(msg.created_at),
        messageType: (msg.message_type || 'text') as 'text' | 'voice' | 'system',
        instructions: msg.instructions || undefined,
        knowledgeEntries: knowledgeEntries
      };
    });
    
    return messages;
  } catch (error) {
    console.error("Error in fetchMessages:", error);
    return [];
  }
}
