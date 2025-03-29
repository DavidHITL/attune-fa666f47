
import { useState, useRef, useEffect } from "react";
import { RealtimeChat } from "@/utils/RealtimeAudio";
import { supabase } from "@/integrations/supabase/client";

export function useVoiceChat(user: any | null) {
  const [isConnecting, setIsConnecting] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [messages, setMessages] = useState<Array<{role: 'user' | 'assistant', text: string}>>([]);
  const chatRef = useRef<RealtimeChat | null>(null);

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
        throw error;
      }
      
      return data?.[0]?.id;
    } catch (error) {
      console.error("Failed to save voice message:", error);
      // Continue with local message handling even if database save fails
      return null;
    }
  };

  // Connect to voice service
  const connect = async () => {
    try {
      setIsConnecting(true);
      
      chatRef.current = new RealtimeChat((text) => {
        setTranscript(prev => prev + text);
      });
      
      await chatRef.current.connect();
      
      console.log("Voice chat connected successfully");

      // Set up listener for AI responses
      if (chatRef.current) {
        // Listen for AI responses
        chatRef.current.addEventListener('response', async (response: string) => {
          // Add AI response to local state
          setMessages(prev => [...prev, { role: 'assistant', text: response }]);
          
          // Save AI response to database
          await saveMessageToDatabase(response, false);
        });
      }
    } catch (error) {
      console.error("Failed to start voice chat:", error);
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
    setMessages([]);
  };

  // Send user message
  const sendMessage = async () => {
    if (!chatRef.current || !transcript.trim()) return;

    // Add user message to chat
    setMessages(prev => [...prev, { role: 'user', text: transcript }]);
    
    // Save user message to database
    await saveMessageToDatabase(transcript, true);
    
    // Send the message
    chatRef.current.sendMessage(transcript);
    
    // Clear transcript for next input
    setTranscript("");
  };

  return {
    isConnecting,
    transcript,
    setTranscript,
    messages,
    chatRef,
    connect,
    disconnect,
    sendMessage
  };
}
