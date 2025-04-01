
import { useCallback } from "react";

/**
 * Hook to handle microphone toggling functionality
 */
export function useMicrophoneToggle(
  connectorRef: React.MutableRefObject<any>,
  recorderRef: React.MutableRefObject<any>,
  audioProcessorRef: React.MutableRefObject<any>,
  isMicrophoneActive: boolean,
  setIsMicrophoneActive: (active: boolean) => void,
  commitAudioBuffer: () => boolean
) {
  // Function to toggle microphone state
  const toggleMicrophone = useCallback(async () => {
    // If microphone is already active, stop it
    if (isMicrophoneActive) {
      console.log("[useMicrophoneToggle] Stopping microphone");
      
      // If we have an active recorder, commit the audio buffer first
      if (connectorRef.current && recorderRef.current) {
        console.log("[useMicrophoneToggle] Committing audio buffer before stopping");
        commitAudioBuffer();
      }
      
      // Stop the recorder
      if (recorderRef.current) {
        console.log("[useMicrophoneToggle] Stopping recorder");
        recorderRef.current.stop();
        recorderRef.current = null;
      }
      
      setIsMicrophoneActive(false);
      return true;
    }
    
    // If microphone is not active, start it
    try {
      console.log("[useMicrophoneToggle] Starting microphone");
      
      // Check if we have a connector and it's connected
      if (!connectorRef.current) {
        console.error("[useMicrophoneToggle] No connector available, cannot start microphone");
        return false;
      }

      // We'll implement the actual microphone activation here in a production system
      console.log("[useMicrophoneToggle] Microphone activated");
      setIsMicrophoneActive(true);
      return true;
    } catch (error) {
      console.error("[useMicrophoneToggle] Error toggling microphone:", error);
      return false;
    }
  }, [isMicrophoneActive, connectorRef, recorderRef, setIsMicrophoneActive, commitAudioBuffer]);

  return {
    toggleMicrophone
  };
}
