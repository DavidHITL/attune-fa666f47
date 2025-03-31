
import { WebRTCOptions } from "./WebRTCTypes";

/**
 * Set up event listeners for the peer connection
 */
export function setupPeerConnectionListeners(
  pc: RTCPeerConnection, 
  options: WebRTCOptions,
  onStateChange: (state: RTCPeerConnectionState) => void
): void {
  // Track ICE connection state
  pc.oniceconnectionstatechange = () => {
    console.log("[WebRTC] ICE connection state:", pc.iceConnectionState);
  };
  
  // Handle incoming tracks (audio)
  pc.ontrack = (event) => {
    console.log("[WebRTC] Received track:", event.track.kind);
    if (options.onTrack) {
      options.onTrack(event);
    }
  };
  
  // Handle connection state changes
  pc.onconnectionstatechange = () => {
    const connectionState = pc.connectionState;
    console.log("[WebRTC] Connection state changed:", connectionState);
    
    onStateChange(connectionState);
    
    if (options.onConnectionStateChange) {
      options.onConnectionStateChange(connectionState);
    }
    
    // Handle disconnection or failure
    if (connectionState === "disconnected" || connectionState === "failed") {
      console.warn("[WebRTC] Connection lost or failed");
    }
  };
}
