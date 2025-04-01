
import { useCallback } from "react";
import { WebRTCConnector } from "@/utils/realtime/WebRTCConnector";
import { AudioProcessor } from "@/utils/realtime/AudioProcessor";
import { AudioRecorder } from "@/utils/realtime/audio/AudioRecorder";

export function useMicrophoneControl(
  isConnected: boolean,
  isMicrophoneActive: boolean,
  connectorRef: React.MutableRefObject<WebRTCConnector | null>,
  recorderRef: React.MutableRefObject<AudioRecorder | null>,
  audioProcessorRef: React.MutableRefObject<AudioProcessor | null>,
  setIsMicrophoneActive: (isMicrophoneActive: boolean) => void
) {
  const getActiveMediaStream = useCallback(() => {
    return recorderRef.current?.getMediaStream() || null;
  }, [recorderRef]);
  
  const getActiveAudioTrack = useCallback(() => {
    return recorderRef.current?.getAudioTrack() || null;
  }, [recorderRef]);
  
  const prewarmMicrophoneAccess = useCallback(async () => {
    console.log("[useMicrophoneControl] Pre-warming microphone access");
    try {
      // Request user permission for microphone access
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        }
      });
      
      // Stop all tracks to release the microphone, as we only needed permission
      stream.getTracks().forEach(track => track.stop());
      
      console.log("[useMicrophoneControl] Successfully pre-warmed microphone access");
      return true;
    } catch (error) {
      console.error("[useMicrophoneControl] Error pre-warming microphone access:", error);
      return false;
    }
  }, []);
  
  // Additional exports for convenience and to maintain API compatibility
  return {
    toggleMicrophone: useCallback(async () => {
      console.log("[useMicrophoneControl] Toggle microphone called, active:", isMicrophoneActive);
      try {
        if (isMicrophoneActive) {
          // Deactivate microphone
          if (recorderRef.current) {
            recorderRef.current.stop();
            recorderRef.current = null;
          }
          if (audioProcessorRef.current) {
            audioProcessorRef.current.stop();
          }
          setIsMicrophoneActive(false);
          return false;
        } else {
          // Activate microphone
          if (!recorderRef.current) {
            recorderRef.current = new AudioRecorder();
            const success = await recorderRef.current.start();
            if (!success) {
              recorderRef.current = null;
              return false;
            }
          }
          setIsMicrophoneActive(true);
          return true;
        }
      } catch (error) {
        console.error("[useMicrophoneControl] Error toggling microphone:", error);
        setIsMicrophoneActive(false);
        return false;
      }
    }, [isMicrophoneActive, recorderRef, audioProcessorRef, setIsMicrophoneActive]),
    getActiveMediaStream,
    getActiveAudioTrack,
    prewarmMicrophoneAccess,
    isMicrophoneReady: false
  };
}
