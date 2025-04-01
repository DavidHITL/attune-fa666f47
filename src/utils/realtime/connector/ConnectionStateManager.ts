
/**
 * Manages the connection state
 */
export class ConnectionStateManager {
  private connectionState: RTCPeerConnectionState = "new";
  private peerConnection: RTCPeerConnection | null = null;
  
  constructor() {
    this.connectionState = "new";
    this.peerConnection = null;
  }
  
  /**
   * Set the peer connection
   */
  setPeerConnection(peerConnection: RTCPeerConnection | null): void {
    this.peerConnection = peerConnection;
  }
  
  /**
   * Get the peer connection
   */
  getPeerConnection(): RTCPeerConnection | null {
    return this.peerConnection;
  }
  
  /**
   * Set the connection state
   */
  setConnectionState(state: RTCPeerConnectionState): void {
    this.connectionState = state;
  }
  
  /**
   * Get the current connection state
   */
  getConnectionState(): RTCPeerConnectionState {
    return this.connectionState;
  }
  
  /**
   * Clean up connection resources
   */
  cleanupConnectionResources(): void {
    // Close the peer connection if it exists
    if (this.peerConnection) {
      try {
        this.peerConnection.close();
      } catch (err) {
        console.warn("[ConnectionStateManager] Error closing peer connection:", err);
      }
      this.peerConnection = null;
    }
  }
}
