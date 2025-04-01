
import { WebRTCOptions } from "../WebRTCTypes";
import { ConnectionTimeout } from "./ConnectionTimeout";
import { ReconnectionManager } from "./ReconnectionManager";

/**
 * Base class for WebRTC connection management providing common functionality
 */
export class ConnectionBase {
  protected options: WebRTCOptions;
  protected connectionState: RTCPeerConnectionState = "new";
  private connectionTimeout: ConnectionTimeout;
  protected reconnectionManager: ReconnectionManager;
  
  constructor(options: WebRTCOptions) {
    this.options = options;
    this.connectionTimeout = new ConnectionTimeout();
    this.reconnectionManager = new ReconnectionManager();
  }
  
  /**
   * Get the current connection state of the WebRTC peer connection
   */
  getConnectionState(): RTCPeerConnectionState {
    return this.connectionState;
  }
  
  /**
   * Clear the connection timeout
   */
  protected clearConnectionTimeout(): void {
    this.connectionTimeout.clearTimeout();
  }
  
  /**
   * Set a connection timeout that will fire if connection takes too long
   */
  protected setConnectionTimeout(timeoutCallback: () => void, timeoutMs: number = 15000): void {
    this.connectionTimeout.setTimeout(timeoutCallback, timeoutMs);
  }
  
  /**
   * Handle errors in the connection process
   */
  protected handleError(error: any): void {
    console.error("[ConnectionBase] WebRTC error:", error);
    
    if (this.options.onError) {
      this.options.onError(error);
    }
  }
}
