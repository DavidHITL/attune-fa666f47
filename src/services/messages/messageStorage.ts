
import { Message } from "@/components/MessageBubble";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { testDatabaseAccess } from "../api/chatService";

// Save message to database with explicit error handling for RLS policy issues
export const saveMessage = async (text: string, isUser: boolean): Promise<string | null> => {
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
      // Show a more helpful message about RLS issues
      toast({
        title: "Database Access Issue",
        description: "Could not save your message to the database due to permissions. Using local mode.",
        variant: "destructive"
      });
      return null;
    }
    
    // Try to insert the message with explicit user_id set to current user
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
        console.error("Row Level Security (RLS) policy issue detected:", error.message);
        toast({
          title: "Database Access Issue",
          description: "Could not save your message to the database due to permissions. Using local mode.",
          variant: "destructive"
        });
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
      toast({
        title: "Database Access Issue",
        description: "Could not fetch your chat history. Using local storage instead.",
        variant: "destructive"
      });
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
      timestamp: new Date(dbMessage.created_at)
    }));
    
    console.log(`Fetched ${formattedMessages.length} messages from database`);
    return formattedMessages;
  } catch (error) {
    console.error("Failed to fetch messages:", error);
    return null;
  }
};
