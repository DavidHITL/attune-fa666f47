
import { useCallback } from "react";
import { toast } from "sonner";
import { WebRTCConnector } from "@/utils/realtime/WebRTCConnector";
import { UseWebRTCConnectionOptions } from "../../types";

export function useConnectionInitiation(
  isConnected: boolean,
  isConnecting: boolean,
  connectorRef: React.MutableRefObject<WebRTCConnector | null>,
  createAndConfigureConnector: () => Promise<WebRTCConnector | null>,
  setIsConnecting: (isConnecting: boolean) => void,
  handleConnectionError: (error: any) => void,
  getActiveAudioTrack: () => MediaStreamTrack | null,
  options: UseWebRTCConnectionOptions
) {
  // Connect to OpenAI Realtime API
  const connect = useCallback(async () => {
    if (isConnected || isConnecting) {
      console.log("[useConnectionInitiation] Already connected or connecting, aborting");
      return false;
    }
    
    try {
      console.log("[useConnectionInitiation] Starting connection process");
      setIsConnecting(true);
      
      // Create a new WebRTC connector with proper options
      const connector = await createAndConfigureConnector();
      
      if (!connector) {
        console.error("[useConnectionInitiation] Failed to create connector");
        setIsConnecting(false);
        toast.error("Failed to create connection");
        return false;
      }
      
      connectorRef.current = connector;
      
      // Get microphone access if needed but not already available
      let audioTrack = getActiveAudioTrack();
      if (!audioTrack && options.enableMicrophone) {
        audioTrack = await requestMicrophoneAccess();
      }
      
      // Attempt to connect with the audio track if available
      console.log("[useConnectionInitiation] Connecting with audio track:", 
        audioTrack ? `${audioTrack.label} (${audioTrack.id})` : "none");
      
      console.time("WebRTC Connection Process");
      const success = await connector.connect(audioTrack || undefined);
      console.timeEnd("WebRTC Connection Process");
      
      if (!success) {
        cleanup();
        toast.error("Connection failed. Please check your API key and try again.");
        return false;
      }
      
      return true;
    } catch (error) {
      console.error("[useConnectionInitiation] Connection error:", error);
      handleConnectionError(error);
      return false;
    }
  }, [
    isConnected,
    isConnecting,
    setIsConnecting,
    getActiveAudioTrack,
    handleConnectionError,
    createAndConfigureConnector,
    connectorRef,
    options.enableMicrophone
  ]);

  // Helper function to request microphone access
  const requestMicrophoneAccess = useCallback(async () => {
    try {
      console.log("[useConnectionInitiation] Requesting microphone access");
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          sampleRate: 16000, // Using 16 kHz for OpenAI compatibility
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        }
      });
      
      const tracks = stream.getAudioTracks();
      if (tracks.length > 0) {
        return tracks[0];
      }
      return undefined;
    } catch (error) {
      console.warn("[useConnectionInitiation] Could not access microphone:", error);
      return undefined;
    }
  }, []);

  // Helper for cleaning up after failed connection attempts
  const cleanup = useCallback(() => {
    if (connectorRef.current) {
      connectorRef.current.disconnect();
      connectorRef.current = null;
    }
    setIsConnecting(false);
  }, [connectorRef, setIsConnecting]);

  return { connect };
}
