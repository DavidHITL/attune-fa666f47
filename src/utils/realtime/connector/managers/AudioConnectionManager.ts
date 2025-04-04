
import { AudioPlaybackManager } from "../../audio/AudioPlaybackManager";

/**
 * Manages audio connection aspects of WebRTC
 */
export class AudioConnectionManager {
  private audioPlaybackManager: AudioPlaybackManager | null = null;
  
  /**
   * Set the audio playback manager
   */
  setAudioPlaybackManager(manager: AudioPlaybackManager | null): void {
    console.log("[AudioConnectionManager] Setting AudioPlaybackManager");
    this.audioPlaybackManager = manager;
    
    if (manager) {
      console.log("[AudioConnectionManager] AudioPlaybackManager configured successfully");
    }
  }
  
  /**
   * Get the audio playback manager
   */
  getAudioPlaybackManager(): AudioPlaybackManager | null {
    return this.audioPlaybackManager;
  }
  
  /**
   * Clean up resources
   */
  cleanup(): void {
    console.log("[AudioConnectionManager] Cleaning up audio resources");
    // No active cleanup needed for now, but we might add it in the future
    this.audioPlaybackManager = null;
  }
}
