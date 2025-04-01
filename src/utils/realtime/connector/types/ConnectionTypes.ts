
/**
 * Callbacks for connection lifecycle events
 */
export interface ConnectionCallbacks {
  /**
   * Called when the connection state changes
   */
  onConnectionStateChange: (state: RTCPeerConnectionState) => void;
  
  /**
   * Called when the data channel opens
   */
  onDataChannelOpen?: () => void;
  
  /**
   * Called when an error occurs
   */
  onError?: (error: any) => void;
}
