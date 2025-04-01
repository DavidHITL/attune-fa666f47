
import { WebRTCOptions } from "../WebRTCTypes";
import { SessionManager } from "./SessionManager";
import { AudioPlaybackManager } from "../audio/AudioPlaybackManager";

/**
 * Manages the configuration of WebRTC sessions
 */
export class SessionConfigurationManager {
  private sessionManager: SessionManager | null = null;
  private audioPlaybackManager: AudioPlaybackManager | null = null;

  /**
   * Set the audio playback manager
   */
  setAudioPlaybackManager(manager: AudioPlaybackManager): void {
    this.audioPlaybackManager = manager;
    
    // Update existing session manager if it exists
    if (this.sessionManager) {
      this.sessionManager.setAudioPlaybackManager(manager);
    }
  }

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
      this.sessionManager = new SessionManager(pc, dc, options, this.audioPlaybackManager || undefined);
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
