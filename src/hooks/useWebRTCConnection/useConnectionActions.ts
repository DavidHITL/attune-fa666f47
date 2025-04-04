
import { useCallback } from "react";
import { WebRTCConnector } from "@/utils/realtime/WebRTCConnector";

/**
 * Hook for managing WebRTC connection actions
 */
export function useConnectionActions(
  isConnected: boolean,
  isConnecting: boolean,
  connectorRef: React.MutableRefObject<WebRTCConnector | null>,
  audioTrackRef: React.MutableRefObject<MediaStreamTrack | null>,
  options: any,
  setIsConnecting: (isConnecting: boolean) => void,
  handleMessage: (event: MessageEvent) => void,
  handleConnectionError: (error: any) => void,
  handleConnectionStateChange: (state: RTCPeerConnectionState) => void
) {
  // Connect to OpenAI Realtime API
  const connect = useCallback(async () => {
    if (isConnected || isConnecting) {
      console.log("[useConnectionActions] Already connected or connecting");
      return;
    }
    
    try {
      console.log("[useConnectionActions] Starting connection process");
      setIsConnecting(true);
      
      console.log("[useConnectionActions] Creating WebRTC connector");
      
      const connector = new WebRTCConnector({
        ...options,
        onConnectionStateChange: handleConnectionStateChange,
        onError: handleConnectionError,
        onMessage: handleMessage
      });
      
      connectorRef.current = connector;
      
      // Get existing audio track if available
      const audioTrack = audioTrackRef.current;
      
      console.log("[useConnectionActions] Connecting to OpenAI");
      const connected = await connector.connect(audioTrack || undefined);
      
      if (!connected) {
        console.error("[useConnectionActions] Failed to connect");
        handleConnectionError(new Error("Failed to establish WebRTC connection"));
        setIsConnecting(false);
        return;
      }
      
      console.log("[useConnectionActions] Connected successfully");
    } catch (error) {
      console.error("[useConnectionActions] Connection error:", error);
      handleConnectionError(error);
      setIsConnecting(false);
    }
  }, [
    connectorRef,
    options,
    isConnected,
    isConnecting,
    setIsConnecting,
    handleConnectionError,
    handleConnectionStateChange,
    handleMessage,
    audioTrackRef
  ]);

  // Send text message to AI
  const sendTextMessage = useCallback((text: string): boolean => {
    if (!connectorRef.current || !isConnected) {
      console.warn("[useConnectionActions] Cannot send message: not connected");
      return false;
    }
    
    try {
      return connectorRef.current.sendTextMessage(text);
    } catch (error) {
      console.error("[useConnectionActions] Error sending text message:", error);
      return false;
    }
  }, [connectorRef, isConnected]);

  // Commit audio buffer to signal end of speech
  const commitAudioBuffer = useCallback((): boolean => {
    if (!connectorRef.current || !isConnected) {
      console.warn("[useConnectionActions] Cannot commit audio buffer: not connected");
      return false;
    }
    
    try {
      return connectorRef.current.commitAudioBuffer();
    } catch (error) {
      console.error("[useConnectionActions] Error committing audio buffer:", error);
      return false;
    }
  }, [connectorRef, isConnected]);

  return {
    connect,
    sendTextMessage,
    commitAudioBuffer
  };
}
