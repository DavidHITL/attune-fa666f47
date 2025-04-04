
import { useCallback } from "react";
import { AudioRecorder } from "@/utils/realtime/audio/AudioRecorder";
import { WebRTCConnector } from "@/utils/realtime/WebRTCConnector";

/**
 * Hook to control microphone for WebRTC connections
 */
export function useMicrophoneControl(
  isConnected: boolean,
  isMicrophoneActive: boolean,
  connectorRef: React.MutableRefObject<WebRTCConnector | null>,
  recorderRef: React.MutableRefObject<AudioRecorder | null>,
  setIsMicrophoneActive: (isMicrophoneActive: boolean) => void
) {
  // Toggle microphone
  const toggleMicrophone = useCallback(async (): Promise<boolean> => {
    console.log("[useMicrophoneControl] Toggle microphone, current state:", isMicrophoneActive);
    
    // If already active, stop it
    if (isMicrophoneActive && recorderRef.current) {
      recorderRef.current.stop();
      recorderRef.current = null;
      setIsMicrophoneActive(false);
      return true;
    }
    
    // Check if connected
    if (!isConnected) {
      console.warn("[useMicrophoneControl] Cannot toggle microphone: not connected");
      return false;
    }
    
    try {
      // Create new recorder
      const recorder = new AudioRecorder({
        onAudioData: () => {
          // WebRTC connection handles audio data directly
        },
        silenceThreshold: 0.01,
        silenceDuration: 3000
      });
      
      // Start recording
      const success = await recorder.start();
      
      if (success) {
        recorderRef.current = recorder;
        setIsMicrophoneActive(true);
        return true;
      }
      
      return false;
    } catch (error) {
      console.error("[useMicrophoneControl] Error toggling microphone:", error);
      return false;
    }
  }, [isConnected, isMicrophoneActive, recorderRef, setIsMicrophoneActive]);

  // Commit audio buffer
  const commitAudioBuffer = useCallback((): boolean => {
    if (!connectorRef.current || !isConnected) {
      console.warn("[useMicrophoneControl] Cannot commit audio buffer: not connected");
      return false;
    }
    
    try {
      return connectorRef.current.commitAudioBuffer();
    } catch (error) {
      console.error("[useMicrophoneControl] Error committing audio buffer:", error);
      return false;
    }
  }, [connectorRef, isConnected]);

  return {
    toggleMicrophone,
    commitAudioBuffer
  };
}
