
import { WebRTCOptions } from "../WebRTCTypes";
import { configureSession } from "../WebRTCSessionConfig";
import { AudioPlaybackManager } from "../audio/AudioPlaybackManager";

/**
 * Manages WebRTC session configuration and state
 */
export class SessionManager {
  private dc: RTCDataChannel;
  private pc: RTCPeerConnection;
  private options: WebRTCOptions;
  private sessionConfigured: boolean = false;
  private configurationTimeout: ReturnType<typeof setTimeout> | null = null;
  private audioPlaybackManager: AudioPlaybackManager | null = null;
  private configurationRetryCount: number = 0;
  private maxConfigRetries: number = 3;
  
  constructor(pc: RTCPeerConnection, dc: RTCDataChannel, options: WebRTCOptions, audioPlaybackManager?: AudioPlaybackManager) {
    this.pc = pc;
    this.dc = dc;
    this.options = options;
    this.audioPlaybackManager = audioPlaybackManager || null;
    
    // Set a timeout to detect if session configuration is taking too long
    this.startConfigurationTimeout();
  }
  
  /**
   * Start a timeout for session configuration
   */
  private startConfigurationTimeout(): void {
    // Clear any existing timeout
    if (this.configurationTimeout) {
      clearTimeout(this.configurationTimeout);
    }
    
    // Increased to 45 seconds from 20 seconds
    const timeoutDuration = 45000;
    
    // Set a timeout for session configuration
    this.configurationTimeout = setTimeout(() => {
      if (!this.sessionConfigured) {
        // First check if audio is currently playing - don't time out if it is
        if (this.audioPlaybackManager && this.audioPlaybackManager.isCurrentlyPlaying()) {
          console.log("[SessionManager] Audio is currently playing, extending session timeout");
          // Restart the timeout to check again later
          this.startConfigurationTimeout();
          return;
        }
        
        // If we haven't exceeded retry count, try again
        if (this.configurationRetryCount < this.maxConfigRetries) {
          this.configurationRetryCount++;
          console.log(`[SessionManager] Session configuration timeout - retrying (${this.configurationRetryCount}/${this.maxConfigRetries})`);
          
          // Try to configure the session again
          this.configureSessionIfReady();
          
          // Restart the timeout
          this.startConfigurationTimeout();
          return;
        }
        
        console.error(`[SessionManager] Session configuration timed out after ${timeoutDuration/1000} seconds and ${this.configurationRetryCount} retries`);
        
        // Report this as an error if the connection still appears to be alive
        if (this.pc?.connectionState === 'connected' && this.options.onError) {
          this.options.onError(new Error("Session configuration timed out"));
        }
      }
      
      this.configurationTimeout = null;
    }, timeoutDuration);
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
    const connectionReady = this.pc?.connectionState === 'connected' || this.pc?.connectionState === 'connecting';
    const dataChannelReady = this.dc?.readyState === 'open';
    
    if (connectionReady && dataChannelReady) {
      console.log("[SessionManager] Both connection and data channel ready, configuring session");
      
      // Clear the configuration timeout since we're configuring now
      if (this.configurationTimeout) {
        clearTimeout(this.configurationTimeout);
        this.configurationTimeout = null;
      }
      
      try {
        // Attempt to configure the session asynchronously
        configureSession(this.dc, this.options)
          .then(() => {
            console.log("[SessionManager] Session configured successfully");
            this.sessionConfigured = true;
          })
          .catch(error => {
            console.error("[SessionManager] Error during session configuration:", error);
            if (this.options.onError) {
              this.options.onError(error);
            }
          });
          
        return true;
      } catch (error) {
        console.error("[SessionManager] Error configuring session:", error);
        
        // Report configuration errors
        if (this.options.onError) {
          this.options.onError(error);
        }
        
        this.sessionConfigured = false;
        return false;
      }
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
    this.configurationRetryCount = 0;
    
    // Clear any pending timeout
    if (this.configurationTimeout) {
      clearTimeout(this.configurationTimeout);
      this.configurationTimeout = null;
    }
  }
  
  /**
   * Set the audio playback manager
   */
  setAudioPlaybackManager(audioPlaybackManager: AudioPlaybackManager): void {
    this.audioPlaybackManager = audioPlaybackManager;
  }
}
