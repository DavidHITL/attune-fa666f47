
import { useCallback } from "react";
import { WebRTCConnector } from "@/utils/realtime/WebRTCConnector";

/**
 * Hook for managing WebRTC connection actions
 */
export function useConnectionActions(
  isConnected: boolean,
  isConnecting: boolean,
  connectorRef: React.MutableRefObject<WebRTCConnector | null>,
  audioProcessorRef: React.MutableRefObject<any>,
  recorderRef: React.MutableRefObject<any>,
  options: any,
  setIsConnecting: (isConnecting: boolean) => void,
  handleMessage: (event: MessageEvent) => void,
  handleConnectionError: (error: any) => void
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
      
      // Check if API key is available
      const apiKey = process.env.NEXT_PUBLIC_OPENAI_API_KEY || localStorage.getItem("OPENAI_API_KEY");
      if (!apiKey) {
        console.error("[useConnectionActions] No API key available");
        handleConnectionError(new Error("No API key available"));
        setIsConnecting(false);
        return;
      }
      
      console.log("[useConnectionActions] Creating WebRTC connector");
      
      const connector = new WebRTCConnector({
        ...options,
        onConnectionStateChange: (state: RTCPeerConnectionState) => {
          console.log("[useConnectionActions] Connection state changed:", state);
          if (state === 'connected') {
            console.log("[useConnectionActions] Successfully connected to OpenAI");
          } else if (['disconnected', 'failed', 'closed'].includes(state)) {
            console.error("[useConnectionActions] Connection state changed to:", state);
          }
        },
        onError: handleConnectionError,
        onMessage: handleMessage
      });
      
      connectorRef.current = connector;
      
      // Get existing audio track if available
      let audioTrack = null;
      if (recorderRef.current) {
        const stream = recorderRef.current.getStream();
        if (stream) {
          const tracks = stream.getAudioTracks();
          if (tracks.length > 0) {
            audioTrack = tracks[0];
            console.log("[useConnectionActions] Using existing audio track:", audioTrack.label);
          }
        }
      }
      
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
    handleMessage,
    recorderRef
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
