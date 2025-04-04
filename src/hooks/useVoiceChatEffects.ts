
import { useEffect } from "react";
import { saveMessage } from "@/services/messages/messageStorage";
import { User } from "@supabase/supabase-js"; 
import { logContextVerification } from "@/services/context/contextVerification";

interface UseVoiceChatEffectsProps {
  isConnected: boolean;
  isAiSpeaking: boolean;
  currentTranscript: string;
  user: User | null;
  systemPrompt?: string;
  disconnect: () => void;
}

/**
 * Hook to handle side effects for voice chat
 * Manages saving transcripts and cleanup on unmount
 */
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
          // Log context verification before saving
          await logContextVerification({
            userId: user.id,
            activeMode: 'voice',
            sessionStarted: true,
            sessionProgress: 0
          }, systemPrompt, {
            transcriptLength: currentTranscript.length,
            aiSpeakingState: isAiSpeaking,
            action: 'saving_transcript'
          });
          
          // Save the AI response to the database
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
