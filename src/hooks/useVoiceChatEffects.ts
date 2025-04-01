
import { useEffect } from "react";
import { saveMessage } from "@/services/messages/messageStorage";
import { User } from "@supabase/supabase-js"; // Import User type directly from supabase

interface UseVoiceChatEffectsProps {
  isConnected: boolean;
  isAiSpeaking: boolean;
  currentTranscript: string;
  user: User | null;
  systemPrompt: string;
  disconnect: () => void;
}

export function useVoiceChatEffects({
  isConnected,
  isAiSpeaking,
  currentTranscript,
  user,
  systemPrompt,
  disconnect
}: UseVoiceChatEffectsProps) {
  // Save transcript when AI finishes speaking
  useEffect(() => {
    const saveTranscript = async () => {
      if (!isAiSpeaking && currentTranscript && user) {
        try {
          await saveMessage(currentTranscript, false, { 
            messageType: 'voice',
            instructions: systemPrompt
          });
          console.log("AI transcript saved to database");
        } catch (error) {
          console.error("Failed to save AI transcript:", error);
        }
      }
    };
    
    saveTranscript();
  }, [isAiSpeaking, currentTranscript, user, systemPrompt]);

  // Handle component unmount - only disconnect when truly ending the session
  useEffect(() => {
    return () => {
      // Only disconnect the WebRTC connection when the component is unmounting
      // This ensures we don't disconnect when just toggling the microphone
      console.log("[VoiceChat] Component unmounting, disconnecting WebRTC connection");
      disconnect();
    };
  }, [disconnect]);
}
