
import { WebRTCOptions } from "../WebRTCTypes";
import { setupPeerConnectionListeners } from "../WebRTCConnectionListeners";

/**
 * Factory for creating and configuring RTCPeerConnection instances
 */
export class PeerConnectionFactory {
  /**
   * Create a new RTCPeerConnection with standard configuration
   * @returns A new RTCPeerConnection
   */
  static createPeerConnection(): RTCPeerConnection {
    console.log("[PeerConnectionFactory] Creating peer connection with standard config");
    
    const config = {
      iceServers: [
        { urls: "stun:stun.l.google.com:19302" },
        { urls: "stun:stun1.l.google.com:19302" }
      ],
      iceCandidatePoolSize: 10
    };
    
    console.log("[PeerConnectionFactory] Using ICE config:", JSON.stringify(config));
    
    try {
      const pc = new RTCPeerConnection(config);
      console.log("[PeerConnectionFactory] Peer connection created successfully");
      return pc;
    } catch (error) {
      console.error("[PeerConnectionFactory] Failed to create peer connection:", error);
      throw new Error(`Failed to create peer connection: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Creates a new RTCPeerConnection with listeners configured
   * @param options WebRTC options
   * @param onStateChange Callback for connection state changes
   * @returns Configured RTCPeerConnection
   */
  static createPeerConnectionWithListeners(
    options: WebRTCOptions,
    onStateChange: (state: RTCPeerConnectionState) => void
  ): RTCPeerConnection {
    const pc = this.createPeerConnection();
    setupPeerConnectionListeners(pc, options, onStateChange);
    return pc;
  }
}
