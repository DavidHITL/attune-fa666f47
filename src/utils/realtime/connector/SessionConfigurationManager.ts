
import { WebRTCOptions } from "../WebRTCTypes";
import { SessionManager } from "./SessionManager";

/**
 * Manages the configuration of WebRTC sessions
 */
export class SessionConfigurationManager {
  private sessionManager: SessionManager | null = null;

  /**
   * Configure the session but only when both the peer connection is connected
   * and the data channel is open
   */
  configureSessionWhenReady(
    pc: RTCPeerConnection | null, 
    dc: RTCDataChannel | null,
    options: WebRTCOptions
  ): boolean {
    if (!pc || !dc) {
      return false;
    }
    
    if (!this.sessionManager) {
      this.sessionManager = new SessionManager(pc, dc, options);
    }
    
    return this.sessionManager.configureSessionIfReady();
  }

  /**
   * Reset the session manager
   */
  resetSessionManager(): void {
    if (this.sessionManager) {
      this.sessionManager.resetSessionConfigured();
      this.sessionManager = null;
    }
  }
}
