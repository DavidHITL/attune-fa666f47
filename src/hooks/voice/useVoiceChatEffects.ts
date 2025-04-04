
import { useEffect } from "react";
import { saveMessage } from "@/services/messages/messageStorage";
import { User } from "@supabase/supabase-js"; 
import { 
  trackModeTransition, 
  logContextVerification 
} from "@/services/context/unifiedContextProvider";
import { UseVoiceChatEffectsProps } from "./types";

/**
 * Hook to handle side effects for voice chat
 * Manages saving transcripts, mode transitions, and cleanup on unmount
 */
export function useVoiceChatEffects({
  isConnected,
  isAiSpeaking,
  currentTranscript,
  user,
  systemPrompt,
  disconnect
}: UseVoiceChatEffectsProps) {
  
  // Log that we're entering voice mode when component mounts
  useEffect(() => {
    const initializeVoiceMode = async () => {
      if (user?.id) {
        console.log(`[VoiceChat] Entering voice mode for user: ${user.id}`);
        
        // Track mode transition (text -> voice)
        await trackModeTransition('text', 'voice', user.id);
        
        // Log context verification
        await logContextVerification({
          userId: user.id,
          activeMode: 'voice',
          sessionStarted: true
        }, systemPrompt, {
          connectionInitiated: new Date().toISOString()
        });
      } else {
        console.log("[VoiceChat] No user ID available for voice mode - using guest mode");
      }
    };
    
    initializeVoiceMode();
    
    return () => {
      if (user?.id) {
        console.log("[VoiceChat] Exiting voice mode");
        // Track transition back to text mode when unmounting
        trackModeTransition('voice', 'text', user.id, currentTranscript).catch(console.error);
      }
    };
  }, [user?.id, systemPrompt, currentTranscript]);

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
