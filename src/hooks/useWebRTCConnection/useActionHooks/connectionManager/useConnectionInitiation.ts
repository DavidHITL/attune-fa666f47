
import { useCallback } from "react";
import { WebRTCConnector } from "@/utils/realtime/WebRTCConnector";
import { UseWebRTCConnectionOptions } from "../../types";

export function useConnectionInitiation(
  connectorRef: React.MutableRefObject<WebRTCConnector | null>,
  audioProcessorRef: React.MutableRefObject<any>,
  recorderRef: React.MutableRefObject<any>,
  options: UseWebRTCConnectionOptions,
  isConnected: boolean,
  isConnecting: boolean,
  setIsConnecting: (isConnecting: boolean) => void,
  handleMessage: (event: MessageEvent) => void,
  handleTrackEvent: (event: RTCTrackEvent) => void,
  getActiveAudioTrack: () => MediaStreamTrack | null
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
      
      // Create a new WebRTC connector
      console.log("[useConnectionInitiation] Creating WebRTC connector");
      
      // Make sure we don't have any previous connector instance
      if (connectorRef.current) {
        console.log("[useConnectionInitiation] Cleaning up previous connector instance");
        connectorRef.current.disconnect();
        connectorRef.current = null;
      }
      
      // Get any existing audio track from the microphone if available
      let audioTrack = getActiveAudioTrack();
      
      // Create a new connector
      connectorRef.current = new WebRTCConnector({
        ...options,
        onMessage: handleMessage,
        onTrack: handleTrackEvent,
      });
      
      // Attempt to connect with the audio track
      console.log("[useConnectionInitiation] Connecting with audio track:", 
        audioTrack ? `${audioTrack.label} (${audioTrack.id})` : "none");
      
      const success = await connectorRef.current.connect(audioTrack || undefined);
      
      if (!success) {
        console.error("[useConnectionInitiation] Connection failed");
        connectorRef.current = null;
        setIsConnecting(false);
        return false;
      }
      
      return true;
    } catch (error) {
      console.error("[useConnectionInitiation] Connection error:", error);
      setIsConnecting(false);
      return false;
    }
  }, [
    isConnected, 
    isConnecting, 
    setIsConnecting, 
    options, 
    handleMessage, 
    handleTrackEvent, 
    connectorRef, 
    getActiveAudioTrack
  ]);

  // For sending messages, we need to add a message sender
  const sendTextMessage = useCallback((text: string) => {
    if (!connectorRef.current) return false;
    
    try {
      return connectorRef.current.sendTextMessage(text);
    } catch (error) {
      console.error("[useConnectionInitiation] Error sending message:", error);
      return false;
    }
  }, [connectorRef]);

  // For committing audio buffers
  const commitAudioBuffer = useCallback(() => {
    if (!connectorRef.current) return false;
    
    try {
      return connectorRef.current.commitAudioBuffer();
    } catch (error) {
      console.error("[useConnectionInitiation] Error committing audio buffer:", error);
      return false;
    }
  }, [connectorRef]);

  return {
    connect,
    sendTextMessage,
    commitAudioBuffer
  };
}
