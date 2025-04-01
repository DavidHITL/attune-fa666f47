
import { useCallback } from "react";

interface UseMicrophonePrewarmProps {
  getActiveMediaStream: () => MediaStream | null;
  setMediaStream: (stream: MediaStream | null) => void;
  setMicrophoneReady: (ready: boolean) => void;
}

/**
 * Hook to handle microphone prewarming functionality
 */
export function useMicrophonePrewarm({
  getActiveMediaStream,
  setMediaStream,
  setMicrophoneReady
}: UseMicrophonePrewarmProps) {
  
  /**
   * Explicitly request microphone access without activating recording
   * Useful to pre-warm microphone permissions before starting a call
   */
  const prewarmMicrophoneAccess = useCallback(async (): Promise<boolean> => {
    try {
      const currentStream = getActiveMediaStream();
      if (currentStream) {
        const tracks = currentStream.getAudioTracks();
        if (tracks.length > 0 && tracks[0].readyState === 'live') {
          console.log("[useMicrophonePrewarm] Microphone already prewarmed");
          return true;
        }
      }

      console.log("[useMicrophonePrewarm] Pre-warming microphone access");
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
          sampleRate: 16000
        } 
      });
      
      setMediaStream(stream);
      setMicrophoneReady(true);
      return true;
    } catch (error) {
      console.error("[useMicrophonePrewarm] Failed to prewarm microphone:", error);
      return false;
    }
  }, [getActiveMediaStream, setMediaStream, setMicrophoneReady]);

  return { prewarmMicrophoneAccess };
}
