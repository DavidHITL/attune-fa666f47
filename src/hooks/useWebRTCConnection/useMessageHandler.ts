
import { useCallback } from "react";
import { WebRTCMessage } from "./types";
import { WebRTCMessageHandler } from "@/utils/realtime/WebRTCMessageHandler";

export function useMessageHandler(
  messageHandlerRef: React.MutableRefObject<WebRTCMessageHandler | null>,
  setMessages: (setter: (prev: WebRTCMessage[]) => WebRTCMessage[]) => void
) {
  // Handle incoming WebRTC messages
  const handleMessage = useCallback((event: MessageEvent) => {
    try {
      const message = JSON.parse(event.data);
      
      // Add to messages for debugging/display
      setMessages(prev => [...prev, message]);
      
      // Use the message handler to process the message
      if (messageHandlerRef.current) {
        messageHandlerRef.current.handleMessage(event);
      }
    } catch (error) {
      console.error("[useWebRTCConnection] Error handling message:", error);
    }
  }, [messageHandlerRef, setMessages]);

  return { handleMessage };
}
