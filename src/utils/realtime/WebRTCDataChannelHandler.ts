
import { WebRTCOptions } from "./WebRTCTypes";

/**
 * Set up event listeners for the data channel
 */
export function setupDataChannelListeners(
  dc: RTCDataChannel,
  options: WebRTCOptions,
  onOpen?: () => void
): void {
  dc.onopen = () => {
    console.log("[WebRTC] Data channel opened, state:", dc.readyState);
    
    // Call the onOpen callback if provided
    if (onOpen) {
      onOpen();
    }
  };
  
  dc.onclose = () => {
    console.log("[WebRTC] Data channel closed, state:", dc.readyState);
  };
  
  dc.onerror = (event) => {
    console.error("[WebRTC] Data channel error:", event);
  };
  
  dc.onmessage = (event) => {
    try {
      // Parse the message and log for debugging
      const message = JSON.parse(event.data);
      console.log("[WebRTC] Received message:", message.type || "unknown type");
      
      // Forward the message to the callback if provided
      if (options.onMessage) {
        options.onMessage(event);
      }
    } catch (error) {
      console.error("[WebRTC] Error processing message:", error);
    }
  };
}
