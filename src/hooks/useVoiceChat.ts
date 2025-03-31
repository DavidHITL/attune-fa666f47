
import { useRef } from 'react';
import { DirectOpenAIConnection } from '@/utils/realtime/DirectOpenAIConnection';
import { User } from '@supabase/supabase-js';

export function useVoiceChat(user: User | null) {
  const chatRef = useRef<DirectOpenAIConnection | null>(null);
  
  // Initialize the chat connection
  const connect = async () => {
    try {
      // Create direct connection to OpenAI
      if (!chatRef.current) {
        // Enable test mode for debugging - set to false for production
        const testMode = false; // Set to true for debugging without API calls
        chatRef.current = new DirectOpenAIConnection({ testMode });
      }
      
      // Customize instructions based on user if needed
      let instructions = "You are a helpful, friendly assistant. Keep your responses concise.";
      
      if (user) {
        // You can customize instructions based on user preferences
        instructions += ` You're speaking with ${user.email || 'a user'}.`;
      }
      
      // Connect to OpenAI's Realtime API
      await chatRef.current.connect(instructions, "alloy");
    } catch (error) {
      console.error("[useVoiceChat] Connection error:", error);
      throw error;
    }
  };
  
  // Disconnect from the chat
  const disconnect = () => {
    if (chatRef.current) {
      chatRef.current.disconnect();
    }
  };
  
  return {
    chatRef,
    connect,
    disconnect
  };
}
