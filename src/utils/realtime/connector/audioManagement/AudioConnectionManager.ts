
import { AudioPlaybackManager } from "../../audio/AudioPlaybackManager";

/**
 * Manages audio playback for WebRTC connections
 */
export class AudioConnectionManager {
  private audioPlaybackManager: AudioPlaybackManager | null = null;

  /**
   * Set the audio playback manager
   * @param manager The audio playback manager to use
   */
  setAudioPlaybackManager(manager: AudioPlaybackManager): void {
    this.audioPlaybackManager = manager;
    console.log("[AudioConnectionManager] Audio playback manager set");
  }

  /**
   * Get the current audio playback manager
   * @returns The current audio playback manager or null if not set
   */
  getAudioPlaybackManager(): AudioPlaybackManager | null {
    return this.audioPlaybackManager;
  }

  /**
   * Cleanup audio resources
   */
  cleanup(): void {
    this.audioPlaybackManager = null;
  }
}
