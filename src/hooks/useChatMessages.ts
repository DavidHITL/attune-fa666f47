
import { useState, useEffect, useCallback } from "react";
import { Message } from "@/components/MessageBubble";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/context/AuthContext";
import { toast } from "@/hooks/use-toast";

export function useChatMessages() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isInitialLoad, setIsInitialLoad] = useState(true);
  const [useLocalFallback, setUseLocalFallback] = useState(false);
  const { user } = useAuth();
  const [hasError, setHasError] = useState(false);

  // Create a memoized fetchMessages function that won't change on re-renders
  const fetchMessages = useCallback(async () => {
    if (!user) {
      console.log("No user, not fetching messages");
      setMessages([{
        id: "welcome",
        text: "Hi there. How are you feeling today?",
        isUser: false,
        timestamp: new Date()
      }]);
      setIsLoading(false);
      setIsInitialLoad(false);
      return;
    }

    try {
      setIsLoading(true);
      setHasError(false);
      console.log("Fetching messages for user:", user.id);
      
      // First try to get user profile to ensure it exists
      const { data: userProfile, error: profileError } = await supabase
        .from('users_profile')
        .select('*')
        .eq('user_id', user.id)
        .single();
      
      if (profileError) {
        console.error("Error fetching user profile:", profileError);
        // If no profile, proceed with just a welcome message
        setMessages([{
          id: "welcome",
          text: "Hi there. How are you feeling today?",
          isUser: false,
          timestamp: new Date()
        }]);
        setIsLoading(false);
        setIsInitialLoad(false);
        return;
      }
      
      console.log("User profile found, fetching messages");
      
      // Get all previous messages for this user
      const { data, error } = await supabase
        .from('messages')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: true });
      
      if (error) {
        console.error("Error fetching messages:", error);
        toast({
          title: "Error loading messages",
          description: "Could not load your chat history. Using local storage instead.",
          variant: "destructive"
        });
        setHasError(true);
        
        // If error, add a welcome message
        setMessages([{
          id: "welcome",
          text: "Hi there. How are you feeling today?",
          isUser: false,
          timestamp: new Date()
        }]);
        
        setIsLoading(false);
        setIsInitialLoad(false);
        return;
      }
      
      console.log(`Found ${data?.length || 0} messages in database`);
      
      if (data && data.length > 0) {
        // Transform database messages to our app format
        const formattedMessages: Message[] = data.map(dbMessage => ({
          id: dbMessage.id.toString(),
          text: dbMessage.content || '',
          isUser: dbMessage.sender_type === 'user',
          timestamp: new Date(dbMessage.created_at)
        }));
        
        console.log("Setting messages from database:", formattedMessages.length);
        setMessages(formattedMessages);
      } else {
        console.log("No messages found, creating welcome message");
        // If no messages, add a welcome message and save it
        const welcomeMessage = {
          id: "welcome",
          text: "Hi there. How are you feeling today?",
          isUser: false,
          timestamp: new Date()
        };
        
        setMessages([welcomeMessage]);
        
        // Save the welcome message to database
        await saveMessageToDatabase(welcomeMessage.text, false);
      }
    } catch (error) {
      console.error("Error in fetchMessages:", error);
      setHasError(true);
      toast({
        title: "Error loading messages",
        description: "Could not load your chat history. Using local storage instead.",
        variant: "destructive"
      });
      
      // Set a welcome message if we can't load from the database
      setMessages([{
        id: "welcome",
        text: "Hi there. How are you feeling today?",
        isUser: false,
        timestamp: new Date()
      }]);
    } finally {
      setIsLoading(false);
      setIsInitialLoad(false);
    }
  }, [user]);

  const saveMessageToDatabase = useCallback(async (text: string, isUser: boolean) => {
    try {
      if (!user) return null; // Don't save if no user is logged in
      
      console.log("Saving message to database:", { text, isUser, userId: user.id });
      
      const { data, error } = await supabase
        .from('messages')
        .insert({
          content: text,
          user_id: user.id,
          sender_type: isUser ? 'user' : 'bot'
        })
        .select();
      
      if (error) {
        console.error("Error saving message to database:", error);
        return null;
      }
      
      console.log("Message saved successfully:", data?.[0]?.id);
      return data?.[0]?.id;
    } catch (error) {
      console.error("Failed to save message:", error);
      return null;
    }
  }, [user]);

  return {
    messages,
    setMessages,
    isLoading,
    setIsLoading,
    isInitialLoad,
    useLocalFallback,
    setUseLocalFallback,
    saveMessageToDatabase,
    fetchMessages,
    hasError
  };
}
