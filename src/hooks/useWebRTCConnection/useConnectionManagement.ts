
import { useCallback, useEffect } from "react";
import { toast } from "sonner";
import { WebRTCConnector } from "@/utils/realtime/WebRTCConnector";
import { UseWebRTCConnectionOptions, WebRTCMessage } from "./types";
import { AudioProcessor } from "@/utils/realtime/AudioProcessor";

export function useConnectionManagement(
  isConnected: boolean,
  isConnecting: boolean,
  connectorRef: React.MutableRefObject<WebRTCConnector | null>,
  audioProcessorRef: React.MutableRefObject<AudioProcessor | null>,
  recorderRef: React.MutableRefObject<any>,
  handleMessage: (event: MessageEvent) => void,
  options: UseWebRTCConnectionOptions,
  setIsConnected: (isConnected: boolean) => void,
  setIsConnecting: (isConnecting: boolean) => void,
  setIsMicrophoneActive: (isMicrophoneActive: boolean) => void,
  setCurrentTranscript: (currentTranscript: string) => void,
  setIsAiSpeaking: (isAiSpeaking: boolean) => void,
  toggleMicrophone: () => Promise<boolean>,
  getActiveAudioTrack: () => MediaStreamTrack | null
) {
  // Enhanced disconnect function with proper cleanup sequence
  const disconnect = useCallback(() => {
    console.log("[useConnectionManagement] Starting disconnection sequence");
    
    // Stop microphone if active
    if (recorderRef.current) {
      console.log("[useConnectionManagement] Stopping microphone");
      recorderRef.current.stop();
      recorderRef.current = null;
      setIsMicrophoneActive(false);
    }
    
    // Disconnect WebRTC
    if (connectorRef.current) {
      console.log("[useConnectionManagement] Disconnecting WebRTC connector");
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
      console.log("[useConnectionManagement] Cleaning up audio processor");
      audioProcessorRef.current.cleanup();
    }
    
    console.log("[useConnectionManagement] Disconnect complete");
  }, [setIsConnected, setIsConnecting, setCurrentTranscript, setIsAiSpeaking, setIsMicrophoneActive, audioProcessorRef, connectorRef, recorderRef]);

  // Ensure we clean up on unmount
  useEffect(() => {
    return disconnect;
  }, [disconnect]);

  // Connect to OpenAI Realtime API with improved audio handling
  const connect = useCallback(async () => {
    if (isConnected || isConnecting) {
      console.log("[useConnectionManagement] Already connected or connecting, aborting");
      return false;
    }
    
    try {
      console.log("[useConnectionManagement] Starting connection process");
      setIsConnecting(true);
      
      // Create a new WebRTC connector
      console.log("[useConnectionManagement] Creating WebRTC connector with options:", 
        JSON.stringify({
          model: options.model || "gpt-4o-realtime-preview-2024-12-17",
          voice: options.voice || "alloy",
          hasInstructions: !!options.instructions
        })
      );
      
      // Make sure we don't have any previous connector instance
      if (connectorRef.current) {
        console.log("[useConnectionManagement] Cleaning up previous connector instance");
        connectorRef.current.disconnect();
        connectorRef.current = null;
      }
      
      // Get any existing audio track from the microphone if available
      let audioTrack = getActiveAudioTrack();
      
      // If no track is available but we need one, try to get one now
      // This ensures we have an audio track BEFORE creating the peer connection
      if (!audioTrack && options.enableMicrophone) {
        console.log("[useConnectionManagement] No active audio track but enableMicrophone is true. Attempting to get microphone permission before connecting.");
        
        try {
          // Request microphone permission first - this is crucial for getting the track before offer creation
          const stream = await navigator.mediaDevices.getUserMedia({
            audio: {
              sampleRate: 24000,
              echoCancellation: true,
              noiseSuppression: true,
              autoGainControl: true
            }
          });
          
          const tracks = stream.getAudioTracks();
          if (tracks.length > 0) {
            audioTrack = tracks[0];
            console.log("[useConnectionManagement] Successfully acquired audio track before connection:", 
              audioTrack.label || "Unnamed track",
              "- Enabled:", audioTrack.enabled,
              "- ID:", audioTrack.id);
          }
        } catch (micError) {
          console.warn("[useConnectionManagement] Could not access microphone before connection:", micError);
          // We'll continue without a track and let the connection process try again
        }
      }
      
      if (audioTrack) {
        console.log("[useConnectionManagement] Using existing audio track for connection:", audioTrack.label);
      } else {
        console.log("[useConnectionManagement] No audio track available, WebRTC connection will request one");
      }
      
      const connector = new WebRTCConnector({
        ...options,
        onMessage: handleMessage,
        // Add onTrack handler to directly use the WebRTC audio stream
        onTrack: (event) => {
          console.log("[useConnectionManagement] Received audio track from WebRTC connection:", 
            event.track.kind, event.track.readyState);
          
          if (event.track.kind === 'audio' && audioProcessorRef.current && audioProcessorRef.current.setAudioStream) {
            // Use the direct WebRTC media stream for audio playback
            console.log("[useConnectionManagement] Setting audio stream for playback");
            audioProcessorRef.current.setAudioStream(event.streams[0]);
            
            // Mark AI as speaking when track becomes active
            event.track.onunmute = () => {
              console.log("[useConnectionManagement] Audio track unmuted - AI is speaking");
              setIsAiSpeaking(true);
            };
            
            // Mark AI as not speaking when track becomes inactive
            event.track.onmute = () => {
              console.log("[useConnectionManagement] Audio track muted - AI stopped speaking");
              setTimeout(() => setIsAiSpeaking(false), 250);
            };
            
            // Handle track ending
            event.track.onended = () => {
              console.log("[useConnectionManagement] Audio track ended");
              setIsAiSpeaking(false);
            };
          }
        },
        onConnectionStateChange: (state) => {
          console.log("[useConnectionManagement] Connection state changed:", state);
          
          if (state === "connected") {
            console.log("[useConnectionManagement] WebRTC connection established successfully");
            setIsConnected(true);
            setIsConnecting(false);
            toast.success("Connected to OpenAI Realtime API");
            
            // Start microphone if enabled
            if (options.enableMicrophone) {
              console.log("[useConnectionManagement] Auto-enabling microphone");
              setTimeout(() => {
                toggleMicrophone().catch(err => {
                  console.error("[useConnectionManagement] Error enabling microphone:", err);
                });
              }, 1000); // Add a small delay before enabling the microphone
            }
          }
          else if (state === "failed") {
            console.error("[useConnectionManagement] WebRTC connection failed");
            toast.error("Connection failed. Please try again.");
            disconnect();
            setIsConnecting(false);
          }
          else if (state === "disconnected") {
            console.warn("[useConnectionManagement] WebRTC connection disconnected");
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
            console.warn("[useConnectionManagement] WebRTC connection closed");
            if (isConnected) {
              toast.error("Connection closed. Please reconnect if needed.");
              disconnect();
            }
          }
        },
        onError: (error) => {
          console.error("[useConnectionManagement] WebRTC error:", error);
          toast.error(`WebRTC error: ${error instanceof Error ? error.message : String(error)}`);
          
          // Only disconnect on critical errors
          if (error instanceof Error &&
             (error.message.includes("timeout") || 
              error.message.includes("failed to set remote description") ||
              error.message.includes("API Error"))) {
            disconnect();
            setIsConnecting(false);
          }
        }
      });
      
      connectorRef.current = connector;
      
      // Attempt to connect with additional logging
      console.log("[useConnectionManagement] Calling connector.connect() with audio track:", 
        audioTrack ? `${audioTrack.label} (${audioTrack.id})` : "none");
      console.time("WebRTC Connection Process");
      
      const success = await connector.connect(audioTrack || undefined);
      
      console.timeEnd("WebRTC Connection Process");
      console.log("[useConnectionManagement] Connection result:", success ? "Success" : "Failed");
      
      if (success) {
        return true;
      } else {
        toast.error("Failed to connect to OpenAI Realtime API. Check console for details.");
        connectorRef.current = null;
        disconnect();
        setIsConnecting(false);
        return false;
      }
    } catch (error) {
      console.error("[useConnectionManagement] Connection error:", error);
      toast.error(`Connection error: ${error instanceof Error ? error.message : String(error)}`);
      disconnect();
      setIsConnecting(false);
      return false;
    }
  }, [handleMessage, isConnected, isConnecting, options, disconnect, setIsConnected, setIsConnecting, toggleMicrophone, getActiveAudioTrack, setIsAiSpeaking, audioProcessorRef]);

  return {
    connect,
    disconnect
  };
}
