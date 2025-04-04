
import { AudioPlaybackManager } from "../../audio/AudioPlaybackManager";
import { WebRTCOptions } from "../../WebRTCTypes";

/**
 * Manages the session configuration for WebRTC connections
 */
export class SessionManager {
  private audioPlaybackManager: AudioPlaybackManager | null = null;
  private configurationTimeout: ReturnType<typeof setTimeout> | null = null;
  
  /**
   * Configure the WebRTC session
   */
  configureSession(
    pc: RTCPeerConnection, 
    dc: RTCDataChannel, 
    options: WebRTCOptions
  ): boolean {
    console.log("[SessionManager] Configuring session");
    
    try {
      // Configure audio stream if available
      if (this.audioPlaybackManager) {
        console.log("[SessionManager] Applying audio playback manager");
        this.setupAudioPlayback(pc);
      }
      
      // Add voice configuration message if needed
      if (options.voice) {
        console.log(`[SessionManager] Configuring voice: ${options.voice}`);
        this.configureVoice(dc, options.voice);
      }
      
      return true;
    } catch (error) {
      console.error("[SessionManager] Error configuring session:", error);
      return false;
    }
  }
  
  /**
   * Set up audio playback from the peer connection
   */
  private setupAudioPlayback(pc: RTCPeerConnection): void {
    if (!this.audioPlaybackManager) {
      console.warn("[SessionManager] Cannot setup audio playback: No audio playback manager");
      return;
    }
    
    // Set up track event handler
    pc.ontrack = (event) => {
      console.log("[SessionManager] Received audio track from peer connection");
      
      if (event.streams && event.streams.length > 0) {
        console.log("[SessionManager] Setting audio stream to playback manager");
        this.audioPlaybackManager?.setAudioSource(event.streams[0]);
      } else {
        console.warn("[SessionManager] Track event has no streams");
      }
    };
  }
  
  /**
   * Configure the voice for the session
   */
  private configureVoice(dc: RTCDataChannel, voice: string): void {
    try {
      // Create voice configuration message
      const voiceConfig = {
        type: "voice_config",
        voice
      };
      
      // Send the configuration message
      dc.send(JSON.stringify(voiceConfig));
      console.log(`[SessionManager] Voice configuration sent: ${voice}`);
    } catch (error) {
      console.error("[SessionManager] Error sending voice configuration:", error);
    }
  }
  
  /**
   * Set the audio playback manager
   */
  setAudioPlaybackManager(manager: AudioPlaybackManager | null): void {
    console.log("[SessionManager] Setting audio playback manager");
    this.audioPlaybackManager = manager;
  }
  
  /**
   * Reset the session configuration
   */
  reset(): void {
    console.log("[SessionManager] Resetting session configuration");
    // Clear any pending timeout
    if (this.configurationTimeout) {
      clearTimeout(this.configurationTimeout);
      this.configurationTimeout = null;
    }
  }
}
