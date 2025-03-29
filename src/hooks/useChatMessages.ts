
import { useState, useEffect } from "react";
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

  // Fetch messages from Supabase when component mounts
  useEffect(() => {
    if (user) {
      fetchMessages();
    } else {
      // If no user, still show initial welcome message
      setMessages([{
        id: "welcome",
        text: "Hi there. How are you feeling today?",
        isUser: false,
        timestamp: new Date()
      }]);
      setIsInitialLoad(false);
    }
  }, [user]);

  const fetchMessages = async () => {
    try {
      setIsLoading(true);
      
      // First try to get user profile to ensure it exists
      const { data: userProfile, error: profileError } = await supabase
        .from('users_profile')
        .select('*')
        .eq('user_id', user?.id)
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
      
      const { data, error } = await supabase
        .from('messages')
        .select('*')
        .eq('user_id', user?.id)
        .order('created_at', { ascending: true });
      
      if (error) {
        console.error("Error fetching messages:", error);
        toast({
          title: "Error loading messages",
          description: "Could not load your chat history. Using local storage instead.",
          variant: "destructive"
        });
        
        // If no messages, add a welcome message
        setMessages([{
          id: "welcome",
          text: "Hi there. How are you feeling today?",
          isUser: false,
          timestamp: new Date()
        }]);
        
        return;
      }
      
      if (data && data.length > 0) {
        // Transform database messages to our app format
        const formattedMessages: Message[] = data.map(dbMessage => ({
          id: dbMessage.id.toString(), // Ensure ID is a string
          text: dbMessage.content || '',
          isUser: dbMessage.sender_type === 'user',
          timestamp: new Date(dbMessage.created_at)
        }));
        setMessages(formattedMessages);
      } else {
        // If no messages, add a welcome message
        const welcomeMsg = {
          id: "welcome",
          text: "Hi there. How are you feeling today?",
          isUser: false,
          timestamp: new Date()
        };
        
        setMessages([welcomeMsg]);
        
        // Save the welcome message to database
        await saveMessageToDatabase("Hi there. How are you feeling today?", false);
      }
    } catch (error) {
      console.error("Error in fetchMessages:", error);
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
  };

  const saveMessageToDatabase = async (text: string, isUser: boolean) => {
    try {
      if (!user) return null; // Don't save if no user is logged in
      
      // Just for debugging, we'll try to save but won't block on failure
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
        // We'll continue with local message handling without showing an error to the user
        return null;
      }
      
      return data?.[0]?.id;
    } catch (error) {
      console.error("Failed to save message:", error);
      // Continue with local message handling even if database save fails
      return null;
    }
  };

  return {
    messages,
    setMessages,
    isLoading,
    setIsLoading,
    isInitialLoad,
    useLocalFallback,
    setUseLocalFallback,
    saveMessageToDatabase
  };
}
