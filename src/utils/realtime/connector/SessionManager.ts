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
  private configurationTimeout: ReturnType<typeof setTimeout> | null = null;
  
  constructor(pc: RTCPeerConnection, dc: RTCDataChannel, options: WebRTCOptions) {
    this.pc = pc;
    this.dc = dc;
    this.options = options;
    
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
    
    // Set a timeout for session configuration (20 seconds - increased from 8 seconds)
    this.configurationTimeout = setTimeout(() => {
      if (!this.sessionConfigured) {
        console.error("[SessionManager] Session configuration timed out after 20 seconds");
        
        // Report this as an error if the connection still appears to be alive
        if (this.pc?.connectionState === 'connected' && this.options.onError) {
          this.options.onError(new Error("Session configuration timed out"));
        }
      }
      
      this.configurationTimeout = null;
    }, 20000);
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
      
      // Clear the configuration timeout since we're configuring now
      if (this.configurationTimeout) {
        clearTimeout(this.configurationTimeout);
        this.configurationTimeout = null;
      }
      
      try {
        configureSession(this.dc, this.options);
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
    
    // Clear any pending timeout
    if (this.configurationTimeout) {
      clearTimeout(this.configurationTimeout);
      this.configurationTimeout = null;
    }
  }
}
