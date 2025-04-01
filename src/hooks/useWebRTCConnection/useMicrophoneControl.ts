
import { useCallback, useRef, useState, useEffect } from "react";
import { toast } from "sonner";
import { AudioRecorder } from "@/utils/realtime/audio/AudioRecorder"; // Updated import path
import { WebRTCConnector } from "@/utils/realtime/WebRTCConnector";
import { useSilenceDetection } from "./useSilenceDetection";
import { useMediaStreamManager } from "./useMediaStreamManager";

export function useMicrophoneControl(
  isConnected: boolean,
  isMicrophoneActive: boolean,
  connectorRef: React.MutableRefObject<WebRTCConnector | null>,
  recorderRef: React.MutableRefObject<AudioRecorder | null>,
  setIsMicrophoneActive: (isMicrophoneActive: boolean) => void
) {
  // Use the media stream manager hook
  const { 
    mediaStreamRef, 
    getActiveMediaStream, 
    getActiveAudioTrack, 
    setMediaStream 
  } = useMediaStreamManager();
  
  const [microphoneReady, setMicrophoneReady] = useState<boolean>(false);

  // Use the silence detection hook
  const { handleSilenceDetected } = useSilenceDetection(connectorRef, isMicrophoneActive);

  // Check microphone permissions on mount
  useEffect(() => {
    const checkMicrophonePermission = async () => {
      try {
        const permissionStatus = await navigator.permissions.query({ name: 'microphone' as PermissionName });
        // If permission is already granted, we can pre-initialize for faster startup
        if (permissionStatus.state === 'granted' && !mediaStreamRef.current) {
          try {
            // Just get access without starting recording
            const stream = await navigator.mediaDevices.getUserMedia({ 
              audio: {
                echoCancellation: true,
                noiseSuppression: true,
                autoGainControl: true,
                sampleRate: 16000 // Updated to 16kHz for OpenAI compatibility
              }
            });
            setMediaStream(stream);
            setMicrophoneReady(true);
            console.log("[useMicrophoneControl] Pre-initialized microphone access");
          } catch (err) {
            console.warn("[useMicrophoneControl] Could not pre-initialize microphone:", err);
          }
        }
      } catch (error) {
        console.warn("[useMicrophoneControl] Could not check microphone permission:", error);
      }
    };
    
    checkMicrophonePermission();
    
    return () => {
      // Clean up any pre-initialized stream when component unmounts
      if (mediaStreamRef.current && !isMicrophoneActive) {
        mediaStreamRef.current.getTracks().forEach(track => track.stop());
        setMediaStream(null);
      }
    };
  }, [isMicrophoneActive, mediaStreamRef, setMediaStream]);

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
      // IMPORTANT: We're specifically NOT destroying the peer connection or disconnecting
      // when just toggling the mic off
      const shouldPreserveStream = true; // Keep the stream for fast resume
      
      if (!shouldPreserveStream && mediaStreamRef.current) {
        mediaStreamRef.current.getTracks().forEach(track => track.stop());
        setMediaStream(null);
      }
      
      recorderRef.current = null;
      setIsMicrophoneActive(false);
      
      // Send a commit signal to let OpenAI know we're done speaking
      // but DO NOT disconnect the entire session
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
          // This is now empty as we don't need to manually send audio data
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
            console.log("[useMicrophoneControl] Reusing existing audio track:", tracks[0].label);
            recorder.setExistingMediaStream(mediaStreamRef.current);
            const success = await recorder.start(true); // true means reuse stream
            
            if (success) {
              recorderRef.current = recorder;
              setIsMicrophoneActive(true);
              toast.success("Microphone activated");
              return true;
            }
          } else {
            console.log("[useMicrophoneControl] Existing track not usable, requesting new one");
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
        console.error("[useWebRTCConnection] Microphone error:", error);
        toast.error(`Microphone error: ${error instanceof Error ? error.message : String(error)}`);
        return false;
      }
    }
  }, [isConnected, isMicrophoneActive, connectorRef, recorderRef, setIsMicrophoneActive, handleSilenceDetected, mediaStreamRef, setMediaStream]);

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
          console.log("[useMicrophoneControl] Microphone already prewarmed");
          return true;
        }
      }

      console.log("[useMicrophoneControl] Pre-warming microphone access");
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
      console.error("[useMicrophoneControl] Failed to prewarm microphone:", error);
      return false;
    }
  }, [getActiveMediaStream, setMediaStream]);

  return {
    toggleMicrophone,
    getActiveMediaStream,
    getActiveAudioTrack,
    prewarmMicrophoneAccess,
    isMicrophoneReady: microphoneReady
  };
}
