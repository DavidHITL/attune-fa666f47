
import { useState, useCallback } from "react";
import { Message } from "@/components/MessageBubble";
import { generateResponse } from "@/services/responseGenerator";
import { createMessageObject } from "@/services/messages/messageUtils";
import { useAuth } from "@/context/AuthContext";

interface UseSendMessageProps {
  messages: Message[];
  setMessages: React.Dispatch<React.SetStateAction<Message[]>>;
  useLocalFallback: boolean;
  setUseLocalFallback: React.Dispatch<React.SetStateAction<boolean>>;
  saveMessageToDatabase: (text: string, isUser: boolean) => Promise<any>;
  isSpeechEnabled: boolean;
  sessionProgress?: number;
}

export function useSendMessage({
  messages,
  setMessages,
  useLocalFallback,
  setUseLocalFallback,
  saveMessageToDatabase,
  isSpeechEnabled,
  sessionProgress = 0
}: UseSendMessageProps) {
  const [isLoading, setIsLoading] = useState(false);
  const { user } = useAuth();

  const handleSendMessage = useCallback(async (text: string) => {
    if (!text.trim()) return;
    
    if (!user) {
      console.error("Authentication required to send messages");
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
      
      // Generate bot response with session progress and context enrichment
      const botResponse = await generateResponse(
        text, 
        messages, 
        useLocalFallback, 
        setUseLocalFallback,
        { sessionProgress }
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
      
    } catch (error) {
      console.error("Error generating response:", error);
      
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
    sessionProgress
  ]);

  return {
    isLoading,
    handleSendMessage
  };
}
