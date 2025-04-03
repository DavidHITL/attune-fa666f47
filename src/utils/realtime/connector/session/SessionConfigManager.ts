
import { WebRTCOptions } from "../../WebRTCTypes";
import { SessionConfigurationManager } from "../SessionConfigurationManager";

/**
 * Manages session configuration for WebRTC connections
 */
export class SessionConfigManager {
  private sessionConfigManager: SessionConfigurationManager;
  
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
    return this.sessionConfigManager.configureSessionWhenReady(pc, dc, options);
  }
  
  /**
   * Reset the session configuration
   */
  reset(): void {
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
