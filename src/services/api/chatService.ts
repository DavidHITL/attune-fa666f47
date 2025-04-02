
import { supabase } from "@/integrations/supabase/client";
import { Message } from "@/components/MessageBubble";
import { MessageMetadata } from "../messages/messageUtils";

// Simple API service for chat operations
export const chatService = {
  saveMessage: async (text: string, isUser: boolean, metadata?: Partial<MessageMetadata>) => {
    try {
      // Get the user from the session
      const { data: session } = await supabase.auth.getSession();
      const user = session?.user;
      
      if (!user) {
        throw new Error("User not authenticated");
      }
      
      // Format any metadata for database storage
      const formattedMetadata = {
        message_type: metadata?.messageType || 'text',
        instructions: metadata?.instructions || null,
        knowledge_entries: metadata?.knowledgeEntries || null,
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
          knowledge_entries: formattedMetadata.knowledge_entries
        })
        .select('id')
        .single();
        
      if (error) {
        throw error;
      }
      
      return data.id.toString();
    } catch (error) {
      console.error("Error saving message:", error);
      throw error;
    }
  },
  
  // Additional chat service methods can be added here
};
