
import { useCallback } from "react";
import { WebRTCConnector } from "@/utils/realtime/WebRTCConnector";
import { UseWebRTCConnectionOptions } from "../../types";

export function useConnectionSetup(
  connectorRef: React.MutableRefObject<WebRTCConnector | null>,
  options: UseWebRTCConnectionOptions,
  setIsConnected: (isConnected: boolean) => void,
  setIsConnecting: (isConnecting: boolean) => void,
  audioTrackRef: React.MutableRefObject<MediaStreamTrack | null>,
  handleConnectionStateChange: (state: RTCPeerConnectionState) => void,
  handleConnectionError: (error: any) => void
) {
  // Initialize connector
  const initializeConnector = useCallback(() => {
    if (!connectorRef.current) {
      console.log("[useConnectionSetup] Initializing WebRTCConnector");
      try {
        connectorRef.current = new WebRTCConnector({
          model: options.model || "gpt-4o-realtime-preview-2024-12-17",
          voice: options.voice || "alloy",
          instructions: options.instructions,
          userId: options.userId,
          onMessage: options.onMessage,
          onConnectionStateChange: (state: RTCPeerConnectionState) => {
            console.log(`[useConnectionSetup] Connection state changed to: ${state}`);
            handleConnectionStateChange(state);
            setIsConnected(state === "connected");
            setIsConnecting(state === "connecting");
          },
          onError: handleConnectionError
        });
        
        return true;
      } catch (error) {
        console.error("[useConnectionSetup] Error initializing WebRTCConnector:", error);
        handleConnectionError(error);
        return false;
      }
    }
    return true;
  }, [connectorRef, options, setIsConnected, setIsConnecting, handleConnectionStateChange, handleConnectionError]);

  const connect = useCallback(async () => {
    console.log("[useConnectionSetup] Connecting to WebRTC server");
    setIsConnecting(true);
    
    // Initialize connector if not already done
    if (!initializeConnector()) {
      console.error("[useConnectionSetup] Failed to initialize connector");
      setIsConnecting(false);
      return false;
    }
    
    try {
      const success = await connectorRef.current!.connect(audioTrackRef.current || undefined);
      console.log(`[useConnectionSetup] Connection ${success ? 'successful' : 'failed'}`);
      
      if (!success) {
        setIsConnecting(false);
      }
      
      return success;
    } catch (error) {
      console.error("[useConnectionSetup] Error connecting:", error);
      handleConnectionError(error);
      setIsConnecting(false);
      return false;
    }
  }, [connectorRef, setIsConnecting, initializeConnector, audioTrackRef, handleConnectionError]);

  return { connect, initializeConnector };
}
