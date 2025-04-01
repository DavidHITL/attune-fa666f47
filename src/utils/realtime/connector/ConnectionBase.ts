
import { WebRTCOptions } from "../WebRTCTypes";
import { ReconnectionManager } from "./ReconnectionManager";
import { ConnectionTimeoutManager } from "./ConnectionTimeoutManager";

/**
 * Base class for WebRTC connection management
 */
export abstract class ConnectionBase {
  protected options: WebRTCOptions;
  protected connectionState: RTCPeerConnectionState = "new";
  protected reconnectionManager: ReconnectionManager;
  protected connectionTimeout: ConnectionTimeoutManager;
  
  constructor(options: WebRTCOptions) {
    this.options = options;
    this.reconnectionManager = new ReconnectionManager();
    this.connectionTimeout = new ConnectionTimeoutManager();
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
    this.connectionTimeout.setTimeout(callback, 30000);
  }
}
