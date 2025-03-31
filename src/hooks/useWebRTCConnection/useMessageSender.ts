
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
    
    try {
      return connectorRef.current.sendTextMessage(text);
    } catch (error) {
      console.error("[useWebRTCConnection] Error sending message:", error);
      toast.error(`Error sending message: ${error instanceof Error ? error.message : String(error)}`);
      return false;
    }
  }, [isConnected, connectorRef]);

  return {
    sendTextMessage
  };
}
