
import { useState, useCallback } from "react";
import { Message } from "@/components/MessageBubble";
import { generateResponse } from "@/services/responseGenerator";
import { speakMessage } from "@/components/ChatSpeech";
import { supabase } from "@/integrations/supabase/client";
import { createMessageObject } from "@/services/chatApiService";
import { toast } from "@/hooks/use-toast";
import { useAuth } from "@/context/AuthContext";

interface UseSendMessageProps {
  messages: Message[];
  setMessages: React.Dispatch<React.SetStateAction<Message[]>>;
  useLocalFallback: boolean;
  setUseLocalFallback: React.Dispatch<React.SetStateAction<boolean>>;
  saveMessageToDatabase: (text: string, isUser: boolean) => Promise<any>;
  isSpeechEnabled: boolean;
}

export function useSendMessage({
  messages,
  setMessages,
  useLocalFallback,
  setUseLocalFallback,
  saveMessageToDatabase,
  isSpeechEnabled
}: UseSendMessageProps) {
  const [isLoading, setIsLoading] = useState(false);
  const { user } = useAuth();

  const checkMessageAnalysisThreshold = useCallback(async (userId: string) => {
    try {
      // Get the current user's profile to check message count
      const { data: profile, error: profileError } = await supabase
        .from('users_profile')
        .select('message_count')
        .eq('user_id', userId)
        .single();

      if (profileError) {
        console.error("Error fetching user profile:", profileError);
        return;
      }

      // If message count is 19 (will become 20 with this message)
      if (profile && profile.message_count === 19) {
        toast({
          title: "Analyzing your communication patterns",
          description: "We'll process your messages to provide insights on your communication style.",
        });
      }
    } catch (error) {
      console.error("Error checking message threshold:", error);
    }
  }, []);

  const handleSendMessage = useCallback(async (text: string) => {
    if (!user) {
      toast({
        title: "Authentication required",
        description: "You need to be logged in to send messages.",
        variant: "destructive"
      });
      return;
    }

    // Check message threshold before sending
    await checkMessageAnalysisThreshold(user.id);

    // Create new user message
    const newUserMessage: Message = {
      id: Date.now().toString(),
      text,
      isUser: true,
      timestamp: new Date()
    };

    // Add user message to local state
    setMessages((prevMessages) => [...prevMessages, newUserMessage]);
    
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
    }
    
    setIsLoading(true);

    try {
      const botResponse = await generateResponse(
        text, 
        messages, 
        useLocalFallback, 
        setUseLocalFallback
      );

      // Save bot response to database and get the saved message ID
      const savedBotMessageId = await saveMessageToDatabase(botResponse.text, false);
      if (savedBotMessageId) {
        botResponse.id = savedBotMessageId.toString();
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
    } finally {
      setIsLoading(false);
    }
  }, [user, messages, useLocalFallback, setUseLocalFallback, saveMessageToDatabase, setMessages, isSpeechEnabled, checkMessageAnalysisThreshold]);

  return {
    isLoading,
    handleSendMessage
  };
}
