
import { useCallback } from "react";
import { toast } from "sonner";
import { WebRTCConnector } from "@/utils/realtime/WebRTCConnector";

export function useMessageSender(
  isConnected: boolean,
  connectorRef: React.MutableRefObject<WebRTCConnector | null>
) {
  // Send text message to OpenAI
  const sendTextMessage = useCallback((text: string) => {
    if (!isConnected || !connectorRef.current) {
      toast.error("Please connect to OpenAI first");
      return false;
    }
    
    if (!connectorRef.current.isDataChannelReady()) {
      toast.error("Data channel is not ready yet. Please wait a moment and try again.");
      return false;
    }
    
    try {
      return connectorRef.current.sendTextMessage(text);
    } catch (error) {
      console.error("[useMessageSender] Error sending message:", error);
      toast.error(`Error sending message: ${error instanceof Error ? error.message : String(error)}`);
      return false;
    }
  }, [isConnected, connectorRef]);

  // Commit audio buffer to signal end of utterance
  const commitAudioBuffer = useCallback(() => {
    if (!isConnected || !connectorRef.current) {
      console.error("[useMessageSender] Cannot commit audio: not connected");
      return false;
    }
    
    if (!connectorRef.current.isDataChannelReady()) {
      console.warn("[useMessageSender] Data channel not ready for audio commit");
      return false;
    }
    
    try {
      console.log("[useMessageSender] Committing audio buffer to signal end of speech");
      return connectorRef.current.commitAudioBuffer();
    } catch (error) {
      console.error("[useMessageSender] Error committing audio buffer:", error);
      return false;
    }
  }, [isConnected, connectorRef]);

  return {
    sendTextMessage,
    commitAudioBuffer
  };
}
