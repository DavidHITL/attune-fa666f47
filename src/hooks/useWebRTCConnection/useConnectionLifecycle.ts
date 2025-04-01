
import { useCallback } from "react";
import { toast } from "sonner";
import { WebRTCConnector } from "@/utils/realtime/WebRTCConnector";
import { UseWebRTCConnectionOptions } from "./types";

export function useConnectionLifecycle(
  isConnected: boolean,
  isConnecting: boolean,
  connectorRef: React.MutableRefObject<WebRTCConnector | null>,
  audioProcessorRef: React.MutableRefObject<any>,
  recorderRef: React.MutableRefObject<any>,
  handleMessage: (event: MessageEvent) => void,
  options: UseWebRTCConnectionOptions,
  setIsConnected: (isConnected: boolean) => void,
  setIsConnecting: (isConnecting: boolean) => void,
  setIsMicrophoneActive: (isMicrophoneActive: boolean) => void,
  setCurrentTranscript: (currentTranscript: string) => void,
  setIsAiSpeaking: (isAiSpeaking: boolean) => void,
  getActiveAudioTrack: () => MediaStreamTrack | null
) {
  // Connect to OpenAI Realtime API with improved audio handling
  const connect = useCallback(async () => {
    if (isConnected || isConnecting) {
      console.log("[useConnectionLifecycle] Already connected or connecting, aborting");
      return false;
    }
    
    try {
      console.log("[useConnectionLifecycle] Starting connection process");
      setIsConnecting(true);
      
      // Create a new WebRTC connector
      console.log("[useConnectionLifecycle] Creating WebRTC connector with options:", 
        JSON.stringify({
          model: options.model || "gpt-4o-realtime-preview-2024-12-17",
          voice: options.voice || "alloy",
          hasInstructions: !!options.instructions
        })
      );
      
      // Make sure we don't have any previous connector instance
      if (connectorRef.current) {
        console.log("[useConnectionLifecycle] Cleaning up previous connector instance");
        connectorRef.current.disconnect();
        connectorRef.current = null;
      }
      
      // Get any existing audio track from the microphone if available
      let audioTrack = getActiveAudioTrack();
      
      // If no track is available but we need one, try to get one now
      // This ensures we have an audio track BEFORE creating the peer connection
      if (!audioTrack && options.enableMicrophone) {
        console.log("[useConnectionLifecycle] No active audio track but enableMicrophone is true. Attempting to get microphone permission before connecting.");
        
        try {
          // Request microphone permission first - this is crucial for getting the track before offer creation
          const stream = await navigator.mediaDevices.getUserMedia({
            audio: {
              sampleRate: 16000, // Using 16 kHz as recommended for OpenAI
              echoCancellation: true,
              noiseSuppression: true,
              autoGainControl: true
            }
          });
          
          const tracks = stream.getAudioTracks();
          if (tracks.length > 0) {
            audioTrack = tracks[0];
            console.log("[useConnectionLifecycle] Successfully acquired audio track before connection:", 
              audioTrack.label || "Unnamed track",
              "- Enabled:", audioTrack.enabled,
              "- ID:", audioTrack.id);
          }
        } catch (micError) {
          console.warn("[useConnectionLifecycle] Could not access microphone before connection:", micError);
          // We'll continue without a track and let the connection process try again
        }
      }
      
      if (audioTrack) {
        console.log("[useConnectionLifecycle] Using existing audio track for connection:", audioTrack.label);
      } else {
        console.log("[useConnectionLifecycle] No audio track available, WebRTC connection will request one");
      }
      
      const connector = new WebRTCConnector({
        ...options,
        onMessage: handleMessage,
        // Add onTrack handler to directly use the WebRTC audio stream
        onTrack: (event) => {
          console.log("[useConnectionLifecycle] Received audio track from WebRTC connection:", 
            event.track.kind, event.track.readyState);
          
          if (event.track.kind === 'audio' && audioProcessorRef.current && audioProcessorRef.current.setAudioStream) {
            // Use the direct WebRTC media stream for audio playback
            console.log("[useConnectionLifecycle] Setting audio stream for playback");
            audioProcessorRef.current.setAudioStream(event.streams[0]);
            
            // Mark AI as speaking when track becomes active
            event.track.onunmute = () => {
              console.log("[useConnectionLifecycle] Audio track unmuted - AI is speaking");
              setIsAiSpeaking(true);
            };
            
            // Mark AI as not speaking when track becomes inactive
            event.track.onmute = () => {
              console.log("[useConnectionLifecycle] Audio track muted - AI stopped speaking");
              setTimeout(() => setIsAiSpeaking(false), 250);
            };
            
            // Handle track ending
            event.track.onended = () => {
              console.log("[useConnectionLifecycle] Audio track ended");
              setIsAiSpeaking(false);
            };
          }
        },
        onConnectionStateChange: (state) => handleConnectionStateChange(state),
        onError: (error) => handleConnectionError(error)
      });
      
      connectorRef.current = connector;
      
      // Attempt to connect with additional logging
      console.log("[useConnectionLifecycle] Calling connector.connect() with audio track:", 
        audioTrack ? `${audioTrack.label} (${audioTrack.id})` : "none");
      console.time("WebRTC Connection Process");
      
      const success = await connector.connect(audioTrack || undefined);
      
      console.timeEnd("WebRTC Connection Process");
      console.log("[useConnectionLifecycle] Connection result:", success ? "Success" : "Failed");
      
      if (!success) {
        toast.error("Failed to connect to OpenAI Realtime API. Check console for details.");
        connectorRef.current = null;
        disconnect();
        setIsConnecting(false);
        return false;
      }
      
      return true;
    } catch (error) {
      console.error("[useConnectionLifecycle] Connection error:", error);
      toast.error(`Connection error: ${error instanceof Error ? error.message : String(error)}`);
      disconnect();
      setIsConnecting(false);
      return false;
    }
  }, [handleMessage, isConnected, isConnecting, options, setIsConnecting, getActiveAudioTrack, setIsAiSpeaking, audioProcessorRef]);

  // Handle connection state changes
  const handleConnectionStateChange = useCallback((state: RTCPeerConnectionState) => {
    console.log("[useConnectionLifecycle] Connection state changed:", state);
    
    if (state === "connected") {
      console.log("[useConnectionLifecycle] WebRTC connection established successfully");
      setIsConnected(true);
      setIsConnecting(false);
      toast.success("Connected to OpenAI Realtime API");
      
      // Start microphone if enabled
      if (options.enableMicrophone) {
        console.log("[useConnectionLifecycle] Auto-enabling microphone");
        setTimeout(() => {
          toggleMicrophone().catch(err => {
            console.error("[useConnectionLifecycle] Error enabling microphone:", err);
          });
        }, 1000); // Add a small delay before enabling the microphone
      }
    }
    else if (state === "failed") {
      console.error("[useConnectionLifecycle] WebRTC connection failed");
      toast.error("Connection failed. Please try again.");
      disconnect();
      setIsConnecting(false);
    }
    else if (state === "disconnected") {
      console.warn("[useConnectionLifecycle] WebRTC connection disconnected");
      // Give a brief period for potential auto-recovery
      const recoveryTimer = setTimeout(() => {
        if (connectorRef.current?.getConnectionState() !== "connected") {
          toast.error("Connection lost. Please reconnect.");
          disconnect();
        }
      }, 5000); // 5 second grace period for auto-recovery
      
      return () => clearTimeout(recoveryTimer);
    }
    else if (state === "closed") {
      console.warn("[useConnectionLifecycle] WebRTC connection closed");
      if (isConnected) {
        toast.error("Connection closed. Please reconnect if needed.");
        disconnect();
      }
    }
  }, [isConnected, options.enableMicrophone, setIsConnected, setIsConnecting]);

  // Handle connection errors
  const handleConnectionError = useCallback((error: any) => {
    console.error("[useConnectionLifecycle] WebRTC error:", error);
    toast.error(`WebRTC error: ${error instanceof Error ? error.message : String(error)}`);
    
    // Only disconnect on critical errors
    if (error instanceof Error &&
       (error.message.includes("timeout") || 
        error.message.includes("failed to set remote description") ||
        error.message.includes("API Error"))) {
      disconnect();
      setIsConnecting(false);
    }
  }, [setIsConnecting]);

  // Function to toggle microphone state
  const toggleMicrophone = useCallback(async () => {
    // This function will be defined in the parent component and passed as a prop
    return Promise.resolve(false);
  }, []);

  // Enhanced disconnect function with proper cleanup sequence
  const disconnect = useCallback(() => {
    console.log("[useConnectionLifecycle] Starting disconnection sequence");
    
    // Stop microphone if active
    if (recorderRef.current) {
      console.log("[useConnectionLifecycle] Stopping microphone");
      recorderRef.current.stop();
      recorderRef.current = null;
      setIsMicrophoneActive(false);
    }
    
    // Disconnect WebRTC
    if (connectorRef.current) {
      console.log("[useConnectionLifecycle] Disconnecting WebRTC connector");
      connectorRef.current.disconnect();
      connectorRef.current = null;
    }
    
    // Reset state
    setIsConnected(false);
    setIsConnecting(false);
    setCurrentTranscript("");
    setIsAiSpeaking(false);
    
    // Clean up audio processor
    if (audioProcessorRef.current) {
      console.log("[useConnectionLifecycle] Cleaning up audio processor");
      audioProcessorRef.current.cleanup();
    }
    
    console.log("[useConnectionLifecycle] Disconnect complete");
  }, [setIsConnected, setIsConnecting, setCurrentTranscript, setIsAiSpeaking, setIsMicrophoneActive, audioProcessorRef, connectorRef, recorderRef]);

  return {
    connect,
    disconnect,
    handleConnectionStateChange
  };
}
