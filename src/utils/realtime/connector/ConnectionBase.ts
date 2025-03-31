
import { WebRTCOptions } from "../WebRTCTypes";

/**
 * Base class for connection management with shared state and utility functions
 */
export class ConnectionBase {
  protected connectionState: RTCPeerConnectionState = "new";
  protected connectionTimeout: number | null = null;
  protected sessionConfigured: boolean = false;
  protected reconnectAttempts: number = 0;
  protected maxReconnectAttempts: number = 3;
  protected options: WebRTCOptions;

  constructor(options: WebRTCOptions) {
    this.options = options;
  }

  /**
   * Get the current connection state
   */
  getConnectionState(): RTCPeerConnectionState {
    return this.connectionState;
  }

  /**
   * Handle errors from the WebRTC connection
   */
  handleError(error: unknown): void {
    const errorMessage = error instanceof Error ? error.message : String(error);
    
    console.error("[WebRTCConnectionManager] Error:", errorMessage);
    
    if (this.options.onError) {
      this.options.onError(new Error(errorMessage));
    }
  }

  /**
   * Clear the connection timeout if it exists
   */
  protected clearConnectionTimeout(): void {
    if (this.connectionTimeout) {
      clearTimeout(this.connectionTimeout);
      this.connectionTimeout = null;
    }
  }
}
