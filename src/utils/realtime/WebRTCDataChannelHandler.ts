
import { WebRTCOptions } from "./WebRTCTypes";

/**
 * Set up event listeners for the data channel
 */
export function setupDataChannelListeners(
  dc: RTCDataChannel,
  options: WebRTCOptions
): void {
  dc.onopen = () => {
    console.log("[WebRTC] Data channel opened");
  };
  
  dc.onclose = () => {
    console.log("[WebRTC] Data channel closed");
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
