import { useCallback, useRef } from "react";
import { WebRTCConnector } from "@/utils/realtime/WebRTCConnector";

/**
 * Hook to handle silence detection and audio buffer commitment
 * @param connectorRef Reference to the WebRTC connector
 * @param isMicrophoneActive Whether the microphone is active
 * @returns Methods for handling silence detection
 */
export function useSilenceDetection(
  connectorRef: React.MutableRefObject<WebRTCConnector | null>,
  isMicrophoneActive: boolean
) {
  // Keep track of silence debounce timeout to prevent rapid commits
  const silenceTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  // Track whether we've committed audio recently to avoid multiple commits
  const recentlyCommittedRef = useRef<boolean>(false);
  
  // Function to handle silence detection and commit audio buffer
  const handleSilenceDetected = useCallback(() => {
    // Only proceed if microphone is active, connected, and we haven't recently committed
    if (connectorRef.current && isMicrophoneActive && !recentlyCommittedRef.current) {
      console.log("[useSilenceDetection] Silence detected, preparing to commit audio buffer");
      
      // Clear any existing timeout
      if (silenceTimeoutRef.current) {
        clearTimeout(silenceTimeoutRef.current);
      }
      
      // Set a short debounce delay before committing
      silenceTimeoutRef.current = setTimeout(() => {
        console.log("[useSilenceDetection] Committing audio buffer after silence debounce");
        
        // Mark as recently committed to prevent multiple rapid commits
        recentlyCommittedRef.current = true;
        
        // Actually commit the audio buffer to signal end of speech
        connectorRef.current?.commitAudioBuffer();
        
        // Reset the recently committed flag after a delay
        setTimeout(() => {
          recentlyCommittedRef.current = false;
        }, 1000);
        
        // Clear timeout reference
        silenceTimeoutRef.current = null;
      }, 300); // Debounce delay - adjust as needed
    }
  }, [connectorRef, isMicrophoneActive]);
  
  // Function to reset the silence detection state
  const resetSilenceDetection = useCallback(() => {
    if (silenceTimeoutRef.current) {
      clearTimeout(silenceTimeoutRef.current);
      silenceTimeoutRef.current = null;
    }
    recentlyCommittedRef.current = false;
  }, []);

  return {
    handleSilenceDetected,
    resetSilenceDetection
  };
}
