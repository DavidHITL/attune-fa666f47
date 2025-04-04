
import { useCallback } from "react";
import { WebRTCConnector } from "@/utils/realtime/WebRTCConnector";
import { toast } from "sonner";

/**
 * Hook for setting up WebRTC connections with proper message handling
 */
export function useConnectionSetup(
  connectorRef: React.MutableRefObject<WebRTCConnector | null>,
  audioProcessorRef: React.MutableRefObject<any>,
  handleMessage: (event: MessageEvent) => void,
  options: any,
  isConnected: boolean,
  isConnecting: boolean,
  setIsConnecting: (isConnecting: boolean) => void,
  getActiveAudioTrack: () => MediaStreamTrack | null,
  handleTrackEvent: (event: RTCTrackEvent) => void
) {
  // Connect to OpenAI Realtime API
  const connect = useCallback(async (): Promise<boolean> => {
    if (isConnected || isConnecting) {
      console.log("[useConnectionSetup] Already connected or connecting, aborting");
      return false;
    }
    
    try {
      console.log("[useConnectionSetup] Starting connection process");
      setIsConnecting(true);
      
      // Create a new WebRTC connector
      console.log("[useConnectionSetup] Creating WebRTC connector with options:", 
        JSON.stringify({
          model: options.model || "gpt-4o-realtime-preview-2024-12-17",
          voice: options.voice || "alloy",
          hasInstructions: !!options.instructions
        })
      );
      
      // Make sure we don't have any previous connector instance
      if (connectorRef.current) {
        console.log("[useConnectionSetup] Cleaning up previous connector instance");
        connectorRef.current.disconnect();
        connectorRef.current = null;
      }
      
      // Get any existing audio track from the microphone if available
      let audioTrack = getActiveAudioTrack();
      
      // If audioTrack is available, log its details
      if (audioTrack) {
        console.log("[useConnectionSetup] Using existing audio track for connection:", audioTrack.label);
      } else {
        console.log("[useConnectionSetup] No audio track available, WebRTC connection will request one");
      }
      
      const connector = new WebRTCConnector({
        ...options,
        onMessage: handleMessage,
        onTrack: handleTrackEvent,
        onConnectionStateChange: (state: RTCPeerConnectionState) => {
          console.log("[useConnectionSetup] Connection state changed:", state);
        },
        onError: (error: any) => {
          console.error("[useConnectionSetup] WebRTC error:", error);
        }
      });
      
      connectorRef.current = connector;
      
      // Attempt to connect
      console.log("[useConnectionSetup] Calling connector.connect() with audio track:", 
        audioTrack ? `${audioTrack.label} (${audioTrack.id})` : "none");
      
      const success = await connector.connect(audioTrack || undefined);
      
      console.log("[useConnectionSetup] Connection result:", success ? "Success" : "Failed");
      
      if (!success) {
        toast.error("Failed to connect to OpenAI Realtime API. Check console for details.");
        connectorRef.current = null;
        setIsConnecting(false);
        return false;
      }
      
      return true;
    } catch (error) {
      console.error("[useConnectionSetup] Connection error:", error);
      toast.error(`Connection error: ${error instanceof Error ? error.message : String(error)}`);
      setIsConnecting(false);
      return false;
    }
  }, [
    handleMessage, 
    isConnected, 
    isConnecting, 
    options, 
    setIsConnecting, 
    getActiveAudioTrack, 
    handleTrackEvent, 
    connectorRef
  ]);

  // Send text message to AI
  const sendTextMessage = useCallback((text: string): boolean => {
    if (!connectorRef.current || !isConnected) {
      console.warn("[useConnectionSetup] Cannot send message: not connected");
      return false;
    }
    
    try {
      console.log("[useConnectionSetup] Sending text message:", text);
      return connectorRef.current.sendTextMessage(text);
    } catch (error) {
      console.error("[useConnectionSetup] Error sending text message:", error);
      return false;
    }
  }, [connectorRef, isConnected]);

  // Commit audio buffer to signal end of speech
  const commitAudioBuffer = useCallback((): boolean => {
    if (!connectorRef.current || !isConnected) {
      console.warn("[useConnectionSetup] Cannot commit audio buffer: not connected");
      return false;
    }
    
    try {
      console.log("[useConnectionSetup] Committing audio buffer");
      return connectorRef.current.commitAudioBuffer();
    } catch (error) {
      console.error("[useConnectionSetup] Error committing audio buffer:", error);
      return false;
    }
  }, [connectorRef, isConnected]);

  return {
    connect,
    sendTextMessage,
    commitAudioBuffer
  };
}
