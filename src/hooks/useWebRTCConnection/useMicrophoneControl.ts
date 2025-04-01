
import { useCallback, useRef, useState, useEffect } from "react";
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
  const [microphoneReady, setMicrophoneReady] = useState<boolean>(false);

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
            mediaStreamRef.current = stream;
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
        mediaStreamRef.current = null;
      }
    };
  }, [isMicrophoneActive]);

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
      const shouldPreserveStream = true; // Set to false if you want to release resources immediately
      
      if (!shouldPreserveStream) {
        if (mediaStreamRef.current) {
          mediaStreamRef.current.getTracks().forEach(track => track.stop());
          mediaStreamRef.current = null;
        }
      }
      
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
        
        // Create the recorder with our callback to continuously send audio data
        const recorder = new AudioRecorder({
          onAudioData: (audioData) => {
            // Send audio data if connection is active
            if (connectorRef.current) {
              connectorRef.current.sendAudioData(audioData);
            }
          },
          timeslice: 100, // Send audio data every 100ms
          sampleRate: 16000 // Explicitly set 16kHz sample rate for OpenAI compatibility
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
          mediaStreamRef.current = recorder.getMediaStream();
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
  }, [isConnected, isMicrophoneActive, connectorRef, recorderRef, setIsMicrophoneActive]);

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

  /**
   * Explicitly request microphone access without activating recording
   * Useful to pre-warm microphone permissions before starting a call
   */
  const prewarmMicrophoneAccess = useCallback(async (): Promise<boolean> => {
    try {
      if (mediaStreamRef.current) {
        const tracks = mediaStreamRef.current.getAudioTracks();
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
          sampleRate: 16000 // Updated to 16kHz
        } 
      });
      
      mediaStreamRef.current = stream;
      setMicrophoneReady(true);
      return true;
    } catch (error) {
      console.error("[useMicrophoneControl] Failed to prewarm microphone:", error);
      return false;
    }
  }, []);

  return {
    toggleMicrophone,
    getActiveMediaStream,
    getActiveAudioTrack,
    prewarmMicrophoneAccess,
    isMicrophoneReady: microphoneReady
  };
}
