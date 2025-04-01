
import { useCallback } from "react";
import { toast } from "sonner";
import { WebRTCConnector } from "@/utils/realtime/WebRTCConnector";
import { UseWebRTCConnectionOptions } from "./types";

/**
 * Base hook for connection management, providing core connection functionality
 */
export function useConnectionBase(
  isConnected: boolean,
  isConnecting: boolean,
  connectorRef: React.MutableRefObject<WebRTCConnector | null>,
  audioProcessorRef: React.MutableRefObject<any>,
  handleMessage: (event: MessageEvent) => void,
  options: UseWebRTCConnectionOptions,
  setIsConnecting: (isConnecting: boolean) => void,
  setCurrentTranscript: (currentTranscript: string) => void,
  setIsAiSpeaking: (isAiSpeaking: boolean) => void,
  getActiveAudioTrack: () => MediaStreamTrack | null
) {
  // Connect to OpenAI Realtime API with improved audio handling
  const connect = useCallback(async () => {
    if (isConnected || isConnecting) {
      console.log("[useConnectionBase] Already connected or connecting, aborting");
      return false;
    }
    
    try {
      console.log("[useConnectionBase] Starting connection process");
      setIsConnecting(true);
      
      // Create a new WebRTC connector
      console.log("[useConnectionBase] Creating WebRTC connector with options:", 
        JSON.stringify({
          model: options.model || "gpt-4o-realtime-preview-2024-12-17",
          voice: options.voice || "alloy",
          hasInstructions: !!options.instructions
        })
      );
      
      // Make sure we don't have any previous connector instance
      if (connectorRef.current) {
        console.log("[useConnectionBase] Cleaning up previous connector instance");
        connectorRef.current.disconnect();
        connectorRef.current = null;
      }
      
      // Get any existing audio track from the microphone if available
      let audioTrack = getActiveAudioTrack();
      
      // If no track is available but we need one, try to get one now
      // This ensures we have an audio track BEFORE creating the peer connection
      if (!audioTrack && options.enableMicrophone) {
        console.log("[useConnectionBase] No active audio track but enableMicrophone is true. Attempting to get microphone permission before connecting.");
        
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
            console.log("[useConnectionBase] Successfully acquired audio track before connection:", 
              audioTrack.label || "Unnamed track",
              "- Enabled:", audioTrack.enabled,
              "- ID:", audioTrack.id);
          }
        } catch (micError) {
          console.warn("[useConnectionBase] Could not access microphone before connection:", micError);
          // We'll continue without a track and let the connection process try again
        }
      }
      
      if (audioTrack) {
        console.log("[useConnectionBase] Using existing audio track for connection:", audioTrack.label);
      } else {
        console.log("[useConnectionBase] No audio track available, WebRTC connection will request one");
      }
      
      const connector = new WebRTCConnector({
        ...options,
        onMessage: handleMessage,
        // Add onTrack handler to directly use the WebRTC audio stream
        onTrack: (event) => handleTrackEvent(event, audioProcessorRef, setIsAiSpeaking),
        onConnectionStateChange: (state) => handleConnectionStateChange(state),
        onError: (error) => handleConnectionError(error)
      });
      
      connectorRef.current = connector;
      
      // Attempt to connect with additional logging
      console.log("[useConnectionBase] Calling connector.connect() with audio track:", 
        audioTrack ? `${audioTrack.label} (${audioTrack.id})` : "none");
      console.time("WebRTC Connection Process");
      
      const success = await connector.connect(audioTrack || undefined);
      
      console.timeEnd("WebRTC Connection Process");
      console.log("[useConnectionBase] Connection result:", success ? "Success" : "Failed");
      
      if (!success) {
        toast.error("Failed to connect to OpenAI Realtime API. Check console for details.");
        connectorRef.current = null;
        setIsConnecting(false);
        return false;
      }
      
      return true;
    } catch (error) {
      console.error("[useConnectionBase] Connection error:", error);
      toast.error(`Connection error: ${error instanceof Error ? error.message : String(error)}`);
      setIsConnecting(false);
      return false;
    }
  }, [handleMessage, isConnected, isConnecting, options, setIsConnecting, getActiveAudioTrack, setIsAiSpeaking, audioProcessorRef, connectorRef]);

  // Handle track events for audio streaming
  const handleTrackEvent = useCallback((
    event: RTCTrackEvent, 
    audioProcessorRef: React.MutableRefObject<any>,
    setIsAiSpeaking: (isAiSpeaking: boolean) => void
  ) => {
    console.log("[useConnectionBase] Received audio track from WebRTC connection:", 
      event.track.kind, event.track.readyState);
    
    if (event.track.kind === 'audio' && audioProcessorRef.current && audioProcessorRef.current.setAudioStream) {
      // Use the direct WebRTC media stream for audio playback
      console.log("[useConnectionBase] Setting audio stream for playback");
      audioProcessorRef.current.setAudioStream(event.streams[0]);
      
      // Mark AI as speaking when track becomes active
      event.track.onunmute = () => {
        console.log("[useConnectionBase] Audio track unmuted - AI is speaking");
        setIsAiSpeaking(true);
      };
      
      // Mark AI as not speaking when track becomes inactive
      event.track.onmute = () => {
        console.log("[useConnectionBase] Audio track muted - AI stopped speaking");
        setTimeout(() => setIsAiSpeaking(false), 250);
      };
      
      // Handle track ending
      event.track.onended = () => {
        console.log("[useConnectionBase] Audio track ended");
        setIsAiSpeaking(false);
      };
    }
  }, []);

  // Handle connection state changes - stub implementation that will be overridden
  const handleConnectionStateChange = useCallback((state: RTCPeerConnectionState) => {
    console.log("[useConnectionBase] Connection state changed:", state);
  }, []);

  // Handle connection errors - stub implementation that will be overridden
  const handleConnectionError = useCallback((error: any) => {
    console.error("[useConnectionBase] WebRTC error:", error);
  }, []);

  return {
    connect
  };
}
