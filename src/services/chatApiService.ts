import { MessageMetadata } from "@/hooks/useWebRTCConnection/types";

import { supabase } from "@/integrations/supabase/client";
import { Message } from "@/components/MessageBubble";

export async function fetchMessages(userId: string): Promise<Message[]> {
  try {
    const { data, error } = await supabase
      .from('messages')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: true });

    if (error) {
      console.error("Error fetching messages:", error);
      return [];
    }

    // Map Supabase data to the Message type
    const messages: Message[] = data.map(msg => ({
      id: msg.id,
      content: msg.content || '',
      isUser: msg.is_user,
      timestamp: new Date(msg.created_at),
      messageType: msg.message_type || 'text',
      instructions: msg.instructions || undefined,
      knowledgeEntries: msg.knowledge_entries || undefined
    }));

    return messages;
  } catch (error) {
    console.error("Error in fetchMessages:", error);
    return [];
  }
}

export async function deleteMessage(messageId: string): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('messages')
      .delete()
      .eq('id', messageId);

    if (error) {
      console.error("Error deleting message:", error);
      return false;
    }

    return true;
  } catch (error) {
    console.error("Error in deleteMessage:", error);
    return false;
  }
}
