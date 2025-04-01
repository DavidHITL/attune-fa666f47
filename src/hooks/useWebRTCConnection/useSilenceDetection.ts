
import { useCallback, useRef } from "react";
import { WebRTCConnector } from "@/utils/realtime/WebRTCConnector";
import { useSilenceDetectorSetup } from "@/components/realtime/useSilenceDetectorSetup";

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
  // Track whether we've committed audio recently to avoid multiple commits
  const recentlyCommittedRef = useRef<boolean>(false);
  // Reference to the timeout for handling silence detection
  const internalTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  
  // Function to handle silence detection and commit audio buffer
  const handleSilenceDetected = useCallback(() => {
    // Only proceed if microphone is active, connected, and we haven't recently committed
    if (connectorRef.current && isMicrophoneActive && !recentlyCommittedRef.current) {
      console.log("[useSilenceDetection] Silence detected, preparing to commit audio buffer");
      
      // Clear any existing timeout
      if (internalTimeoutRef.current) {
        clearTimeout(internalTimeoutRef.current);
      }
      
      // Set a short debounce delay before committing
      internalTimeoutRef.current = setTimeout(() => {
        console.log("[useSilenceDetection] Committing audio buffer after silence debounce");
        
        // Mark as recently committed to prevent multiple rapid commits
        recentlyCommittedRef.current = true;
        
        // Actually commit the audio buffer to signal end of speech
        connectorRef.current?.commitAudioBuffer();
        
        // Reset the recently committed flag after a delay
        setTimeout(() => {
          recentlyCommittedRef.current = false;
        }, 3000);  // 3 seconds delay before allowing another commit
        
        // Clear timeout reference
        internalTimeoutRef.current = null;
      }, 300); // Debounce delay - adjust as needed
    }
  }, [connectorRef, isMicrophoneActive]);
  
  // Set up silence detector with appropriate parameters
  const { silenceDetectorRef, silenceTimeoutRef } = useSilenceDetectorSetup({
    handleSilenceDetected
  });
  
  // Function to reset the silence detection state
  const resetSilenceDetection = useCallback(() => {
    // Clear our internal timeout
    if (internalTimeoutRef.current) {
      clearTimeout(internalTimeoutRef.current);
      internalTimeoutRef.current = null;
    }
    
    // Clear the timeout from silenceDetectorSetup
    if (silenceTimeoutRef.current) {
      clearTimeout(silenceTimeoutRef.current);
      silenceTimeoutRef.current = null;
    }
    
    recentlyCommittedRef.current = false;
    
    // Reset the silence detector if available
    if (silenceDetectorRef.current) {
      silenceDetectorRef.current.reset();
    }
  }, [silenceTimeoutRef, silenceDetectorRef]);

  return {
    handleSilenceDetected,
    resetSilenceDetection
  };
}
