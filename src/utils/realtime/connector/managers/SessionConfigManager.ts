
import { WebRTCOptions } from "../../WebRTCTypes";
import { AudioPlaybackManager } from "../../audio/AudioPlaybackManager";

/**
 * Manages session configuration for WebRTC connections
 */
export class SessionConfigManager {
  private sessionConfigManager: any;
  private configurationTimeout: ReturnType<typeof setTimeout> | null = null;
  private configurationAttempts: number = 0;
  private readonly MAX_CONFIG_ATTEMPTS = 3;
  
  constructor() {
    this.sessionConfigManager = {}; // Will be initialized when needed
  }
  
  /**
   * Configure the session
   * @param pc The peer connection
   * @param dc The data channel
   * @param options WebRTC options
   * @returns Whether the session was successfully configured
   */
  configureSession(
    pc: RTCPeerConnection, 
    dc: RTCDataChannel, 
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
        
        // Set timeout for retry - increased from 1s to 2s for better reliability
        this.configurationTimeout = setTimeout(() => {
          console.log(`[SessionConfigManager] Retrying configuration after timeout`);
          this.configureSession(pc, dc, options);
          this.configurationTimeout = null;
        }, 2000);
        
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
    
    try {
      // Create message for session configuration
      const sessionConfig = {
        event_id: `event_config_${Date.now()}`,
        type: "session.update",
        session: {
          modalities: ["text", "audio"],
          instructions: options.instructions || "You are a helpful AI assistant.",
          voice: options.voice || "alloy",
          input_audio_format: "opus", 
          output_audio_format: "pcm16", 
          input_audio_transcription: {
            model: "whisper-1"
          },
          turn_detection: {
            type: "server_vad",
            threshold: 0.5,
            prefix_padding_ms: 300,
            silence_duration_ms: 1000
          },
          temperature: 0.75,
          priority_hints: [
            "Maintain consistent awareness of user details across the conversation",
            "Remember previous messages regardless of text or voice interface used"
          ]
        }
      };
      
      // Send configuration
      console.log("[SessionConfigManager] Sending session configuration");
      dc.send(JSON.stringify(sessionConfig));
      
      return true;
    } catch (error) {
      console.error("[SessionConfigManager] Error configuring session:", error);
      return false;
    }
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
  }

  /**
   * Set the audio playback manager
   * @param manager The audio playback manager to use
   */
  setAudioPlaybackManager(manager: AudioPlaybackManager): void {
    // Store the manager for future use
    console.log("[SessionConfigManager] Setting AudioPlaybackManager");
  }
}
