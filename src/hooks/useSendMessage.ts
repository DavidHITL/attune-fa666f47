
import { useState, useCallback } from "react";
import { Message } from "@/components/MessageBubble";
import { generateResponse } from "@/services/responseGenerator";
import { speakMessage } from "@/components/ChatSpeech";
import { createMessageObject } from "@/services/chatApiService";
import { toast } from "@/hooks/use-toast";
import { useAuth } from "@/context/AuthContext";
import { supabase } from "@/integrations/supabase/client";

interface UseSendMessageProps {
  messages: Message[];
  setMessages: React.Dispatch<React.SetStateAction<Message[]>>;
  useLocalFallback: boolean;
  setUseLocalFallback: React.Dispatch<React.SetStateAction<boolean>>;
  saveMessageToDatabase: (text: string, isUser: boolean) => Promise<any>;
  isSpeechEnabled: boolean;
  sessionProgress?: number; // New prop for session progress
}

export function useSendMessage({
  messages,
  setMessages,
  useLocalFallback,
  setUseLocalFallback,
  saveMessageToDatabase,
  isSpeechEnabled,
  sessionProgress = 0 // Default to 0 if not provided
}: UseSendMessageProps) {
  const [isLoading, setIsLoading] = useState(false);
  const { user } = useAuth();

  const handleSendMessage = useCallback(async (text: string) => {
    if (!text.trim()) return; // Don't send empty messages
    
    if (!user) {
      toast({
        title: "Authentication required",
        description: "You need to be logged in to send messages.",
        variant: "destructive"
      });
      return;
    }

    // Create new user message
    const newUserMessage = createMessageObject(text, true);

    // Add user message to local state immediately
    setMessages((prevMessages) => [...prevMessages, newUserMessage]);
    
    // Track if we need to update the message ID after saving
    let needsIdUpdate = true;
    
    // Start loading state for bot reply
    setIsLoading(true);

    try {
      // Only try to save to database if not already in local fallback mode
      if (!useLocalFallback) {
        try {
          // Save user message to database and get the saved message ID
          const savedMessageId = await saveMessageToDatabase(text, true);
          if (savedMessageId) {
            // Update the message ID in state if we got one from the database
            newUserMessage.id = savedMessageId.toString();
            setMessages(prev => 
              prev.map(msg => 
                msg.id === newUserMessage.id ? {...msg, id: savedMessageId.toString()} : msg
              )
            );
            needsIdUpdate = false;
          }
        } catch (err) {
          console.error("Could not save user message:", err);
          setUseLocalFallback(true);
          // Continue with local mode
        }
      }
      
      // Generate bot response with session progress
      const botResponse = await generateResponse(
        text, 
        messages, 
        useLocalFallback, 
        setUseLocalFallback,
        sessionProgress // Pass the session progress
      );

      // Try to save bot response to database if not in local fallback mode
      if (!useLocalFallback) {
        try {
          const savedBotMessageId = await saveMessageToDatabase(botResponse.text, false);
          if (savedBotMessageId) {
            botResponse.id = savedBotMessageId.toString();
          }
        } catch (err) {
          console.error("Could not save bot response:", err);
          setUseLocalFallback(true);
          // Continue with local mode
        }
      }

      // Add bot response to local state
      setMessages((prevMessages) => [...prevMessages, botResponse]);
      
      // Speak the bot's response if speech is enabled
      speakMessage(botResponse.text, isSpeechEnabled);
      
    } catch (error) {
      console.error("Error generating response:", error);
      toast({
        title: "Error",
        description: "Failed to generate a response. Please try again.",
        variant: "destructive"
      });
      
      // If we couldn't save the user message with an ID and still need to update
      if (needsIdUpdate) {
        // Make sure the message still appears in the UI even if saving failed
        setMessages(prev => 
          prev.map(msg => 
            msg.id === newUserMessage.id ? {...msg} : msg
          )
        );
      }
    } finally {
      setIsLoading(false);
    }
  }, [
    user, 
    messages, 
    useLocalFallback, 
    setUseLocalFallback, 
    saveMessageToDatabase, 
    setMessages, 
    isSpeechEnabled,
    sessionProgress // Add sessionProgress to dependencies
  ]);

  return {
    isLoading,
    handleSendMessage
  };
}
