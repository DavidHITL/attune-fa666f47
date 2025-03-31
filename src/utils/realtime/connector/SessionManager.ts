
import { WebRTCOptions } from "../WebRTCTypes";
import { configureSession } from "../WebRTCSessionConfig";

/**
 * Manages WebRTC session configuration and state
 */
export class SessionManager {
  private dc: RTCDataChannel;
  private pc: RTCPeerConnection;
  private options: WebRTCOptions;
  private sessionConfigured: boolean = false;

  constructor(pc: RTCPeerConnection, dc: RTCDataChannel, options: WebRTCOptions) {
    this.pc = pc;
    this.dc = dc;
    this.options = options;
  }

  /**
   * Configure the session when both connection and data channel are ready
   */
  configureSessionIfReady(): boolean {
    // Don't configure more than once
    if (this.sessionConfigured) {
      return false;
    }

    // Check if connection and data channel are ready
    if (this.pc?.connectionState === 'connected' && this.dc?.readyState === 'open') {
      console.log("[SessionManager] Both connection and data channel ready, configuring session");
      this.sessionConfigured = true;
      configureSession(this.dc, this.options);
      return true;
    } else {
      console.log(`[SessionManager] Not yet ready to configure session. Connection: ${this.pc?.connectionState}, DataChannel: ${this.dc?.readyState}`);
      return false;
    }
  }

  /**
   * Check if the session has been configured
   */
  isSessionConfigured(): boolean {
    return this.sessionConfigured;
  }

  /**
   * Reset the session configuration status
   */
  resetSessionConfigured(): void {
    this.sessionConfigured = false;
  }
}
