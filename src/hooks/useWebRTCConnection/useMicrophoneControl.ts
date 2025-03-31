
import { useCallback, useRef } from "react";
import { toast } from "sonner";
import { AudioRecorder } from "@/utils/realtime/AudioRecorder";
import { WebRTCConnector } from "@/utils/realtime/WebRTCConnector";

export function useMicrophoneControl(
  isConnected: boolean,
  isMicrophoneActive: boolean,
  connectorRef: React.MutableRefObject<WebRTCConnector | null>,
  recorderRef: React.MutableRefObject<AudioRecorder | null>,
  setIsMicrophoneActive: (isMicrophoneActive: boolean) => void
) {
  // Store the last MediaStream reference here
  const mediaStreamRef = useRef<MediaStream | null>(null);

  // Toggle microphone on/off
  const toggleMicrophone = useCallback(async () => {
    if (!isConnected || !connectorRef.current) {
      toast.error("Please connect to OpenAI first");
      return false;
    }
    
    if (isMicrophoneActive && recorderRef.current) {
      // Stop recording
      recorderRef.current.stop();
      mediaStreamRef.current = null;  // Clear the reference when stopping
      recorderRef.current = null;
      setIsMicrophoneActive(false);
      return true;
    } else {
      // Start recording
      try {
        // Check if browser supports getUserMedia
        if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
          toast.error("Your browser doesn't support microphone access");
          return false;
        }
        
        // First request permission to avoid surprising the user
        const permissionResult = await navigator.permissions.query({ name: 'microphone' as PermissionName });
        
        if (permissionResult.state === 'denied') {
          toast.error("Microphone access is blocked. Please allow access in your browser settings.");
          return false;
        }
        
        const recorder = new AudioRecorder({
          onAudioData: (audioData) => {
            // Send audio data if connection is active
            if (connectorRef.current) {
              connectorRef.current.sendAudioData(audioData);
            }
          }
        });
        
        const success = await recorder.start();
        
        if (success) {
          recorderRef.current = recorder;
          // Store the MediaStream reference when starting
          mediaStreamRef.current = recorder.getMediaStream();
          setIsMicrophoneActive(true);
          toast.success("Microphone activated");
          return true;
        } else {
          toast.error("Failed to start microphone");
          return false;
        }
      } catch (error) {
        console.error("[useWebRTCConnection] Microphone error:", error);
        toast.error(`Microphone error: ${error instanceof Error ? error.message : String(error)}`);
        return false;
      }
    }
  }, [isConnected, isMicrophoneActive, connectorRef, setIsMicrophoneActive]);

  /**
   * Get the current active MediaStream, if available
   */
  const getActiveMediaStream = useCallback(() => {
    return mediaStreamRef.current || (recorderRef.current?.getMediaStream() || null);
  }, [recorderRef]);

  /**
   * Get the current active audio track, if available
   */
  const getActiveAudioTrack = useCallback(() => {
    const stream = getActiveMediaStream();
    if (!stream) return null;
    
    const tracks = stream.getAudioTracks();
    return tracks.length > 0 ? tracks[0] : null;
  }, [getActiveMediaStream]);

  return {
    toggleMicrophone,
    getActiveMediaStream,
    getActiveAudioTrack
  };
}
