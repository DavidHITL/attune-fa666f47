
import { useRef, useEffect } from 'react';
import { RealtimeChat } from '@/utils/RealtimeAudio';
import { toast } from 'sonner';
import { useAuth } from '@/context/AuthContext';

export function useVoiceChat(user: any) {
  const chatRef = useRef<RealtimeChat | null>(null);
  const transcriptRef = useRef<string>('');

  const updateTranscript = (text: string) => {
    transcriptRef.current = text;
  };

  // Clean up on unmount
  useEffect(() => {
    return () => {
      if (chatRef.current) {
        chatRef.current.disconnect();
        chatRef.current = null;
      }
    };
  }, []);

  // Connect to the voice chat service
  const connect = async () => {
    try {
      if (chatRef.current && chatRef.current.isConnected) {
        console.log("Voice chat is already connected");
        return;
      }

      // Create a new instance if one doesn't exist
      if (!chatRef.current) {
        console.log("Creating new RealtimeChat instance");
        chatRef.current = new RealtimeChat(updateTranscript);

        // Set up error handling
        chatRef.current.addEventListener('error', (error: any) => {
          console.error("Voice chat error:", error);
          
          if (error.type === 'connection_error') {
            toast.error("Could not connect to voice chat service");
          } else if (error.type === 'audio_error') {
            toast.error("Audio issue: Please check your microphone permissions");
          }
        });
      }

      console.log("Connecting to voice chat service...");
      await chatRef.current.connect();
      console.log("Successfully connected to voice chat service");

    } catch (error) {
      console.error("Failed to start voice chat:", error);
      toast.error("Could not start voice chat. Please try again later.");
      throw error;
    }
  };

  // Disconnect from the voice chat service
  const disconnect = () => {
    if (chatRef.current) {
      console.log("Disconnecting from voice chat service");
      chatRef.current.disconnect();
    }
  };

  return {
    chatRef,
    transcript: transcriptRef.current,
    connect,
    disconnect
  };
}
