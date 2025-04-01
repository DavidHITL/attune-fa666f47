import { useCallback } from "react";
import { toast } from "sonner";
import { AudioRecorder } from "@/utils/realtime/audio/AudioRecorder";
import { WebRTCConnector } from "@/utils/realtime/WebRTCConnector";

interface UseMicrophoneToggleProps {
  isConnected: boolean;
  isMicrophoneActive: boolean;
  microphonePermission: PermissionState | null;
  connectorRef: React.MutableRefObject<WebRTCConnector | null>;
  recorderRef: React.MutableRefObject<AudioRecorder | null>;
  mediaStreamRef: React.MutableRefObject<MediaStream | null>;
  setMediaStream: (stream: MediaStream | null) => void;
  setIsMicrophoneActive: (active: boolean) => void;
  setMicrophoneReady: (ready: boolean) => void;
  handleSilenceDetected: () => void;
}

/**
 * Hook to handle microphone toggle functionality
 */
export function useMicrophoneToggle({
  isConnected,
  isMicrophoneActive,
  microphonePermission,
  connectorRef,
  recorderRef,
  mediaStreamRef,
  setMediaStream,
  setIsMicrophoneActive,
  setMicrophoneReady,
  handleSilenceDetected
}: UseMicrophoneToggleProps) {
  
  // Toggle microphone on/off
  const toggleMicrophone = useCallback(async () => {
    if (!isConnected || !connectorRef.current) {
      toast.error("Please connect to OpenAI first");
      return false;
    }
    
    if (isMicrophoneActive && recorderRef.current) {
      // Stop recording 
      recorderRef.current.stop();
      
      // Don't clear the mediaStreamRef if we're just pausing - keep it for fast resume
      const shouldPreserveStream = true; // Keep the stream for fast resume
      
      if (!shouldPreserveStream && mediaStreamRef.current) {
        mediaStreamRef.current.getTracks().forEach(track => track.stop());
        setMediaStream(null);
      }
      
      recorderRef.current = null;
      setIsMicrophoneActive(false);
      
      // Send a commit signal to let OpenAI know we're done speaking
      if (connectorRef.current) {
        connectorRef.current.commitAudioBuffer();
      }
      
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
        
        // Create the recorder primarily for tracking mic state and showing visual feedback
        const recorder = new AudioRecorder({
          onAudioData: () => {
            // We don't need to manually send audio data anymore
            // The WebRTC connection will handle this directly
          },
          onSilenceDetected: handleSilenceDetected,
          timeslice: 100,
          sampleRate: 16000,
          silenceThreshold: 0.01,
          silenceDuration: 1500
        });
        
        // If we already have a stream, try to reuse it
        if (mediaStreamRef.current) {
          const tracks = mediaStreamRef.current.getAudioTracks();
          if (tracks.length > 0 && tracks[0].readyState === 'live') {
            console.log("[useMicrophoneToggle] Reusing existing audio track:", tracks[0].label);
            recorder.setExistingMediaStream(mediaStreamRef.current);
            const success = await recorder.start(true); // true means reuse stream
            
            if (success) {
              recorderRef.current = recorder;
              setIsMicrophoneActive(true);
              toast.success("Microphone activated");
              return true;
            }
          } else {
            console.log("[useMicrophoneToggle] Existing track not usable, requesting new one");
          }
        }
        
        // If we got here, we need a new stream
        const success = await recorder.start();
        
        if (success) {
          recorderRef.current = recorder;
          // Store the MediaStream reference when starting
          setMediaStream(recorder.getMediaStream());
          setMicrophoneReady(true);
          setIsMicrophoneActive(true);
          toast.success("Microphone activated");
          return true;
        } else {
          toast.error("Failed to start microphone");
          return false;
        }
      } catch (error) {
        console.error("[useMicrophoneToggle] Microphone error:", error);
        toast.error(`Microphone error: ${error instanceof Error ? error.message : String(error)}`);
        return false;
      }
    }
  }, [
    isConnected, 
    isMicrophoneActive, 
    connectorRef, 
    recorderRef, 
    mediaStreamRef, 
    setMediaStream,
    setIsMicrophoneActive,
    setMicrophoneReady,
    handleSilenceDetected
  ]);

  return { toggleMicrophone };
}
