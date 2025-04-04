
import { WebRTCOptions } from "../../WebRTCTypes";
import { SessionConfigurationManager } from "../SessionConfigurationManager";

/**
 * Manages session configuration for WebRTC connections
 */
export class SessionConfigManager {
  private sessionConfigManager: SessionConfigurationManager;
  private configurationTimeout: ReturnType<typeof setTimeout> | null = null;
  private configurationAttempts: number = 0;
  private readonly MAX_CONFIG_ATTEMPTS = 3;
  
  constructor() {
    this.sessionConfigManager = new SessionConfigurationManager();
  }
  
  /**
   * Configure the session
   * @param pc The peer connection
   * @param dc The data channel
   * @param options WebRTC options
   * @returns Whether the session was successfully configured
   */
  configureSession(
    pc: RTCPeerConnection | null, 
    dc: RTCDataChannel | null, 
    options: WebRTCOptions
  ): boolean {
    // Validate the data channel state is open before configuring
    if (dc && dc.readyState !== 'open') {
      console.warn(`[SessionConfigManager] Cannot configure session with closed data channel (state: ${dc.readyState})`);
      
      // If we haven't exceeded max attempts, retry after a delay
      if (this.configurationAttempts < this.MAX_CONFIG_ATTEMPTS) {
        this.configurationAttempts++;
        
        // Clear any existing timeout
        if (this.configurationTimeout) {
          clearTimeout(this.configurationTimeout);
        }
        
        console.log(`[SessionConfigManager] Will retry configuration (attempt ${this.configurationAttempts}/${this.MAX_CONFIG_ATTEMPTS})`);
        
        // Set timeout for retry
        this.configurationTimeout = setTimeout(() => {
          console.log(`[SessionConfigManager] Retrying configuration after timeout`);
          this.configureSession(pc, dc, options);
          this.configurationTimeout = null;
        }, 1000);
        
        return false;
      } else {
        console.error(`[SessionConfigManager] Failed to configure session after ${this.MAX_CONFIG_ATTEMPTS} attempts`);
        return false;
      }
    }
    
    // Reset attempts counter on successful configuration
    this.configurationAttempts = 0;
    
    // Clear any pending timeout
    if (this.configurationTimeout) {
      clearTimeout(this.configurationTimeout);
      this.configurationTimeout = null;
    }
    
    // Log that we're configuring the session with an open data channel
    if (dc) {
      console.log(`[SessionConfigManager] Configuring session with data channel in state: ${dc.readyState}`);
    }
    
    return this.sessionConfigManager.configureSessionWhenReady(pc, dc, options);
  }
  
  /**
   * Reset the session configuration
   */
  reset(): void {
    // Clear any pending timeout
    if (this.configurationTimeout) {
      clearTimeout(this.configurationTimeout);
      this.configurationTimeout = null;
    }
    
    this.configurationAttempts = 0;
    this.sessionConfigManager.resetSessionManager();
  }

  /**
   * Set the audio playback manager
   * @param manager The audio playback manager to use
   */
  setAudioPlaybackManager(manager: any): void {
    this.sessionConfigManager.setAudioPlaybackManager(manager);
  }
}
