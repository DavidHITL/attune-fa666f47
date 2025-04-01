
import { useCallback } from "react";
import { toast } from "sonner";
import { WebRTCConnector } from "@/utils/realtime/WebRTCConnector";

/**
 * Hook to manage sending messages and committing audio buffers
 */
export function useMessageManager(
  isConnected: boolean,
  connectorRef: React.MutableRefObject<WebRTCConnector | null>,
  isDataChannelReady: boolean
) {
  // Send a text message to OpenAI
  const sendTextMessage = useCallback((text: string) => {
    if (!isConnected || !connectorRef.current) {
      toast.error("Please connect to OpenAI first");
      return false;
    }
    
    if (!isDataChannelReady) {
      toast.error("Data channel is not ready yet. Please wait a moment and try again.");
      return false;
    }
    
    try {
      return connectorRef.current.sendTextMessage(text);
    } catch (error) {
      console.error("[useMessageManager] Error sending message:", error);
      toast.error(`Error sending message: ${error instanceof Error ? error.message : String(error)}`);
      return false;
    }
  }, [isConnected, connectorRef, isDataChannelReady]);

  // Commit the audio buffer to signal end of speech
  const commitAudioBuffer = useCallback(() => {
    if (!isConnected || !connectorRef.current) {
      console.error("[useMessageManager] Cannot commit audio: not connected");
      return false;
    }
    
    if (!isDataChannelReady) {
      console.warn("[useMessageManager] Data channel not ready for audio commit");
      return false;
    }
    
    try {
      console.log("[useMessageManager] Committing audio buffer to signal end of speech");
      return connectorRef.current.commitAudioBuffer();
    } catch (error) {
      console.error("[useMessageManager] Error committing audio buffer:", error);
      return false;
    }
  }, [isConnected, connectorRef, isDataChannelReady]);

  return {
    sendTextMessage,
    commitAudioBuffer
  };
}
