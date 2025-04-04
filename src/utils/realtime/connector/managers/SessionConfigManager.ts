
import { WebRTCOptions } from "../../WebRTCTypes";
import { configureSession } from "../../WebRTCSessionConfig";
import { AudioPlaybackManager } from "../../audio/AudioPlaybackManager";

/**
 * Manages WebRTC session configuration
 */
export class SessionConfigManager {
  private sessionConfigured: boolean = false;
  private configurationTimeout: ReturnType<typeof setTimeout> | null = null;
  private audioPlaybackManager: AudioPlaybackManager | null = null;
  private configurationRetryCount: number = 0;
  private maxConfigRetries: number = 3;
  
  /**
   * Configure the session
   */
  configureSession(
    pc: RTCPeerConnection, 
    dc: RTCDataChannel, 
    options: WebRTCOptions
  ): void {
    if (this.sessionConfigured) {
      console.log("[SessionConfigManager] Session already configured, skipping");
      return;
    }
    
    console.log("[SessionConfigManager] Configuring session");
    
    try {
      // Configure the session
      configureSession(pc, dc, options);
      
      // Mark session as configured
      this.sessionConfigured = true;
      
      console.log("[SessionConfigManager] Session configured successfully");
      
      // Clear the timeout
      if (this.configurationTimeout) {
        clearTimeout(this.configurationTimeout);
        this.configurationTimeout = null;
      }
    } catch (error) {
      console.error("[SessionConfigManager] Error configuring session:", error);
      this.sessionConfigured = false;
    }
  }
  
  /**
   * Set the audio playback manager
   */
  setAudioPlaybackManager(manager: AudioPlaybackManager | null): void {
    this.audioPlaybackManager = manager;
  }
  
  /**
   * Reset session configuration
   */
  reset(): void {
    console.log("[SessionConfigManager] Resetting session configuration");
    this.sessionConfigured = false;
    
    // Clear the timeout
    if (this.configurationTimeout) {
      clearTimeout(this.configurationTimeout);
      this.configurationTimeout = null;
    }
    
    // Reset retry count
    this.configurationRetryCount = 0;
  }
  
  /**
   * Check if session is configured
   */
  isSessionConfigured(): boolean {
    return this.sessionConfigured;
  }
}
