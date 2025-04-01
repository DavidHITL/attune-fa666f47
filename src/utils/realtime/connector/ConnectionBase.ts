
import { WebRTCOptions } from "../WebRTCTypes";
import { ReconnectionManager } from "./ReconnectionManager";
import { ConnectionTimeout } from "./ConnectionTimeout";

/**
 * Base class for WebRTC connection management
 */
export abstract class ConnectionBase {
  protected options: WebRTCOptions;
  protected connectionState: RTCPeerConnectionState = "new";
  protected reconnectionManager: ReconnectionManager;
  protected connectionTimeout: ConnectionTimeout;
  
  constructor(options: WebRTCOptions) {
    this.options = options;
    this.reconnectionManager = new ReconnectionManager();
    this.connectionTimeout = new ConnectionTimeout(30000); // 30-second timeout for connection establishment
  }
  
  /**
   * Get the current connection state
   */
  getConnectionState(): RTCPeerConnectionState {
    return this.connectionState;
  }
  
  /**
   * Handle errors in the connection process
   */
  protected handleError(error: any): void {
    console.error("[ConnectionBase] Error in WebRTC connection:", error);
    
    // Call the error callback if provided
    if (this.options.onError) {
      this.options.onError(error);
    }
  }
  
  /**
   * Clear any pending connection timeout
   */
  protected clearConnectionTimeout(): void {
    this.connectionTimeout.clearTimeout();
  }
  
  /**
   * Set a connection timeout
   */
  protected setConnectionTimeout(callback: () => void): void {
    this.connectionTimeout.setTimeout(() => {
      console.error("[ConnectionBase] Connection timeout reached");
      callback();
    });
  }
}
