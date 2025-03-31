
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
    console.log("[WebRTC] ICE connection state changed:", pc.iceConnectionState);
    
    // Additional logging for ICE failure conditions
    if (pc.iceConnectionState === 'failed') {
      console.error("[WebRTC] ICE connection failed - check network configuration and firewall settings");
    } else if (pc.iceConnectionState === 'disconnected') {
      console.warn("[WebRTC] ICE connection disconnected - may reconnect automatically");
    }
  };
  
  // Track ICE gathering state
  pc.onicegatheringstatechange = () => {
    console.log("[WebRTC] ICE gathering state:", pc.iceGatheringState);
  };
  
  // Log ICE candidates
  pc.onicecandidate = (event) => {
    if (event.candidate) {
      console.log("[WebRTC] New ICE candidate:", event.candidate.type, event.candidate.protocol, event.candidate.address);
    } else {
      console.log("[WebRTC] ICE candidate gathering complete");
    }
  };
  
  // Handle incoming tracks (audio)
  pc.ontrack = (event) => {
    console.log("[WebRTC] Received track:", event.track.kind, event.track.id);
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
      
      // Log extended diagnostic information
      console.log("[WebRTC] Connection diagnostic information:", {
        iceConnectionState: pc.iceConnectionState,
        iceGatheringState: pc.iceGatheringState,
        signalingState: pc.signalingState
      });
    }
  };
  
  // Signaling state changes
  pc.onsignalingstatechange = () => {
    console.log("[WebRTC] Signaling state changed:", pc.signalingState);
  };
}
