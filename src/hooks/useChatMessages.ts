
import { useState, useEffect, useCallback } from "react";
import { Message } from "@/components/MessageBubble";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/context/AuthContext";
import { toast } from "@/hooks/use-toast";
import { saveMessage, fetchMessagesFromDatabase } from "@/services/chatApiService";

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

      // Get messages directly from the database using our improved function
      const dbMessages = await fetchMessagesFromDatabase();
      
      if (!dbMessages) {
        console.log("No messages found or error fetching, creating welcome message");
        // If no messages or error, add a welcome message
        const welcomeMessage = {
          id: "welcome",
          text: "Hi there. How are you feeling today?",
          isUser: false,
          timestamp: new Date()
        };
        
        setMessages([welcomeMessage]);
        
        // Don't try to save the welcome message if we already had database errors
        if (!useLocalFallback) {
          // Try saving the welcome message to database, but don't throw if it fails
          try {
            await saveMessage(welcomeMessage.text, false);
          } catch (err) {
            console.log("Could not save welcome message, continuing in local mode");
            setUseLocalFallback(true);
          }
        }
      } else {
        console.log("Setting messages from database:", dbMessages.length);
        setMessages(dbMessages);
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
      
      // Mark as using local fallback
      setUseLocalFallback(true);
    } finally {
      setIsLoading(false);
      setIsInitialLoad(false);
    }
  }, [user, useLocalFallback]);

  const saveMessageToDatabase = useCallback(async (text: string, isUser: boolean) => {
    try {
      if (!user) return null; // Don't save if no user is logged in
      
      // If we're already in local fallback mode, don't try to save to the database
      if (useLocalFallback) {
        console.log("In local fallback mode, not saving to database");
        return null;
      }
      
      console.log("Saving message to database:", { text, isUser, userId: user.id });
      
      // Use our improved direct save function
      const messageId = await saveMessage(text, isUser);
      
      if (!messageId) {
        console.error("Could not save message to database");
        if (!useLocalFallback) {
          setUseLocalFallback(true);
        }
        return null;
      }
      
      console.log("Message saved successfully:", messageId);
      return messageId;
    } catch (error) {
      console.error("Failed to save message:", error);
      if (!useLocalFallback) {
        setUseLocalFallback(true);
      }
      return null;
    }
  }, [user, useLocalFallback]);

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
