import React, { useState, useRef, useEffect } from "react";
import { RealtimeChat } from "@/utils/RealtimeAudio";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { ChatError, ErrorType } from "@/utils/realtime/types";

// Import the new EndpointTester component
import EndpointTester from './realtime/EndpointTester';

export function useVoiceChat(user: any | null) {
  const [isConnecting, setIsConnecting] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [messages, setMessages] = useState<Array<{role: 'user' | 'assistant', text: string, timestamp?: Date}>>([]);
  const chatRef = useRef<RealtimeChat | null>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const [lastSpeechData, setLastSpeechData] = useState<Float32Array | null>(null);
  const [databaseError, setDatabaseError] = useState(false);

  // Save message to database
  const saveMessageToDatabase = async (text: string, isUser: boolean) => {
    try {
      if (!user) return; // Don't save if no user is logged in
      
      const { data, error } = await supabase
        .from('messages')
        .insert({
          content: text,
          user_id: user.id,
          sender_type: isUser ? 'user' : 'bot'
        })
        .select();
      
      if (error) {
        console.error("Error saving voice message to database:", error);
        setDatabaseError(true);
        throw error;
      }
      
      setDatabaseError(false);
      return data?.[0]?.id;
    } catch (error) {
      console.error("Failed to save voice message:", error);
      // Continue with local message handling even if database save fails
      return null;
    }
  };
  
  // Retry database connection
  const retryDatabaseConnection = async () => {
    try {
      const { error } = await supabase.from('messages').select('id').limit(1);
      
      if (error) {
        console.error("Database still not accessible:", error);
        toast.error("Still unable to connect to database");
      } else {
        setDatabaseError(false);
        toast.success("Database connection restored");
      }
    } catch (error) {
      console.error("Database reconnection attempt failed:", error);
      toast.error("Still unable to connect to database");
    }
  };

  // Handle voice chat errors
  const handleChatError = (error: ChatError) => {
    console.error("Voice chat error:", error);
    
    switch (error.type) {
      case ErrorType.CONNECTION:
        toast.error("Connection to voice service lost. Attempting to reconnect...");
        break;
      case ErrorType.AUDIO:
        toast.error("Audio processing error. Please check your microphone.");
        break;
      case ErrorType.SERVER:
        toast.error(`Server error: ${error.message}`);
        break;
      default:
        toast.error("An error occurred with the voice chat");
    }
  };

  // Connect to voice service
  const connect = async () => {
    try {
      setIsConnecting(true);
      
      // Disconnect existing instance if any
      if (chatRef.current) {
        disconnect();
      }
      
      // Initialize RealtimeChat with the transcript callback
      chatRef.current = new RealtimeChat((text) => {
        setTranscript(prev => text);  // Update with latest transcript instead of appending
      });
      
      // Register error handler
      chatRef.current.addEventListener('error', handleChatError);
      
      await chatRef.current.connect();
      
      console.log("Voice chat connected successfully");
      toast.success("Voice chat connected");

      // Set up listener for AI responses
      if (chatRef.current) {
        // Listen for AI responses
        chatRef.current.addEventListener('response', async (response: string) => {
          // Add AI response to local state
          setMessages(prev => [...prev, { 
            role: 'assistant', 
            text: response, 
            timestamp: new Date() 
          }]);
          
          // Save AI response to database
          await saveMessageToDatabase(response, false);
        });
      }
    } catch (error) {
      console.error("Failed to start voice chat:", error);
      toast.error("Failed to connect to voice service");
    } finally {
      setIsConnecting(false);
    }
  };

  // Disconnect from voice service
  const disconnect = () => {
    if (chatRef.current) {
      chatRef.current.disconnect();
      chatRef.current = null;
    }
    setTranscript("");
    
    // Clear any pending timeouts
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
  };

  // Send user message
  const sendMessage = async () => {
    if (!chatRef.current || !transcript.trim()) return;

    const currentTranscript = transcript.trim();

    // Add user message to chat
    setMessages(prev => [...prev, { 
      role: 'user', 
      text: currentTranscript, 
      timestamp: new Date() 
    }]);
    
    // Save user message to database
    await saveMessageToDatabase(currentTranscript, true);
    
    // Send the message
    chatRef.current.sendMessage(currentTranscript);
    
    // Clear transcript for next input
    setTranscript("");
  };

  // Process and send speech data to API if available
  useEffect(() => {
    if (!chatRef.current || !lastSpeechData) return;
    
    chatRef.current.sendSpeechData(lastSpeechData);
    setLastSpeechData(null);
  }, [lastSpeechData]);

  // Process audio input from the microphone
  const processSpeechInput = (audioData: Float32Array) => {
    setLastSpeechData(audioData);
  };

  return {
    isConnecting,
    transcript,
    setTranscript,
    messages,
    chatRef,
    connect,
    disconnect,
    sendMessage,
    processSpeechInput,
    databaseError,
    retryDatabaseConnection
  };
}

// Add the EndpointTester component to the render output, 
// likely near the bottom of the component's JSX
// This is just a suggestion - you'll need to find an appropriate
// location in the existing VoiceChat component

// For example, add this somewhere in the returned JSX:
// <div className="mt-4">
//   <EndpointTester />
// </div>
