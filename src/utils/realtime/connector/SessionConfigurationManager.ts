
import { WebRTCOptions } from "../WebRTCTypes";

/**
 * Manages the configuration of WebRTC sessions
 */
export class SessionConfigurationManager {
  /**
   * Configure the session when all components are ready
   */
  configureSessionWhenReady(
    pc: RTCPeerConnection | null, 
    dc: RTCDataChannel | null, 
    options: WebRTCOptions
  ): boolean {
    if (!pc || !dc) {
      console.error("[SessionConfigurationManager] Cannot configure session: Missing peer connection or data channel");
      return false;
    }
    
    if (pc.connectionState !== "connected") {
      console.warn(`[SessionConfigurationManager] Cannot configure session: Peer connection not connected (state: ${pc.connectionState})`);
      return false;
    }
    
    if (dc.readyState !== "open") {
      console.warn(`[SessionConfigurationManager] Cannot configure session: Data channel not open (state: ${dc.readyState})`);
      return false;
    }
    
    console.log("[SessionConfigurationManager] Configuring session with voice:", options.voice || "default");
    
    // Configure voice if specified
    if (options.voice) {
      try {
        const voiceConfig = {
          type: "voice_config",
          voice: options.voice
        };
        
        dc.send(JSON.stringify(voiceConfig));
        console.log(`[SessionConfigurationManager] Voice configured: ${options.voice}`);
      } catch (error) {
        console.error("[SessionConfigurationManager] Error configuring voice:", error);
        return false;
      }
    }
    
    // Set up ontrack handler if provided
    if (options.onTrack) {
      pc.ontrack = options.onTrack;
      console.log("[SessionConfigurationManager] Track handler configured");
    }
    
    return true;
  }
}
