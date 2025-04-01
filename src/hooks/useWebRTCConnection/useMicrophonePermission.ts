import { useState, useEffect } from "react";

/**
 * Hook to check and handle microphone permission state
 * @returns Information about the microphone permission status
 */
export function useMicrophonePermission() {
  const [microphoneReady, setMicrophoneReady] = useState<boolean>(false);

  // Check microphone permissions on mount
  useEffect(() => {
    const checkMicrophonePermission = async () => {
      try {
        const permissionStatus = await navigator.permissions.query({ name: 'microphone' as PermissionName });
        setMicrophoneReady(permissionStatus.state === 'granted');
      } catch (error) {
        console.warn("[useMicrophonePermission] Could not check microphone permission:", error);
      }
    };
    
    checkMicrophonePermission();
  }, []);

  /**
   * Explicitly request microphone access without activating recording
   * Useful to pre-warm microphone permissions before starting a call
   */
  const prewarmMicrophoneAccess = async (): Promise<boolean> => {
    try {
      console.log("[useMicrophonePermission] Pre-warming microphone access");
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
          sampleRate: 16000
        } 
      });
      
      // Keep track of the stream for cleanup
      if (stream && stream.getTracks().length > 0) {
        setMicrophoneReady(true);
        return true;
      }
      return false;
    } catch (error) {
      console.error("[useMicrophonePermission] Failed to prewarm microphone:", error);
      return false;
    }
  };

  return {
    isMicrophoneReady: microphoneReady,
    prewarmMicrophoneAccess,
  };
}
