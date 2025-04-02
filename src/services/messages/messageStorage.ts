
import { supabase } from "@/integrations/supabase/client";
import { createMessageObject } from "./messageUtils";
import { MessageMetadata } from "@/hooks/useWebRTCConnection/types";
import { v4 as uuidv4 } from 'uuid';

/**
 * Save a message to the database
 * @param content The message content
 * @param isUser Whether the message is from the user
 * @param metadata Optional metadata about the message
 * @returns The ID of the saved message or null if saving failed
 */
export async function saveMessage(
  content: string,
  isUser: boolean,
  metadata?: Partial<MessageMetadata>
): Promise<string | null> {
  try {
    const { data: user } = await supabase.auth.getUser();
    if (!user?.user?.id) {
      console.error("No user found, cannot save message");
      return null;
    }

    const { data, error } = await supabase
      .from('messages')
      .insert({
        id: uuidv4(),
        content: content,
        is_user: isUser,
        user_id: user.user.id,
        message_type: metadata?.messageType || 'text',
        instructions: metadata?.instructions || null,
        knowledge_entries: metadata?.knowledgeEntries || null
      })
      .select()
      .single();

    if (error) {
      console.error("Error saving message:", error);
      return null;
    }

    return data?.id?.toString() || null;
  } catch (error) {
    console.error("Error in saveMessage:", error);
    return null;
  }
}

/**
 * Fetch messages from the database for the current user
 * @returns Array of messages or null if fetching failed
 */
export async function fetchMessagesFromDatabase() {
  try {
    const { data: user } = await supabase.auth.getUser();
    if (!user?.user?.id) {
      console.error("No user found, cannot fetch messages");
      return null;
    }

    const { data, error } = await supabase
      .from('messages')
      .select('*')
      .eq('user_id', user.user.id)
      .order('created_at', { ascending: true });

    if (error) {
      console.error("Error fetching messages:", error);
      return null;
    }

    // Map Supabase data to the Message type
    return data.map(msg => ({
      id: msg.id.toString(),
      text: msg.content || '',
      content: msg.content || '',
      isUser: msg.is_user,
      timestamp: new Date(msg.created_at),
      messageType: msg.message_type || 'text',
      instructions: msg.instructions || undefined,
      knowledgeEntries: msg.knowledge_entries || undefined
    }));
  } catch (error) {
    console.error("Error in fetchMessagesFromDatabase:", error);
    return null;
  }
}
