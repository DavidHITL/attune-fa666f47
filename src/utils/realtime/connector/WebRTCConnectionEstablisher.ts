
import { WebRTCOptions } from "../WebRTCTypes";
import { ConnectionEstablisher } from "./ConnectionEstablisher";
import { ConnectionCallbacks } from "./types/ConnectionTypes";

export class WebRTCConnectionEstablisher {
  private connectionEstablisher: ConnectionEstablisher;
  
  constructor() {
    this.connectionEstablisher = new ConnectionEstablisher();
  }

  /**
   * Establish a WebRTC connection to OpenAI
   * @param apiKey OpenAI API key
   * @param options WebRTC options
   * @param onConnectionStateChange Callback for connection state changes
   * @param onDataChannelOpen Callback for data channel open event
   * @param onError Callback for errors
   * @param audioTrack Optional MediaStreamTrack to add to the peer connection
   */
  async establish(
    apiKey: string,
    options: WebRTCOptions,
    onConnectionStateChange: (state: RTCPeerConnectionState) => void,
    onDataChannelOpen: () => void,
    onError: (error: any) => void,
    audioTrack?: MediaStreamTrack
  ): Promise<{ pc: RTCPeerConnection; dc: RTCDataChannel } | null> {
    const callbacks: ConnectionCallbacks = {
      onConnectionStateChange,
      onDataChannelOpen,
      onError
    };
    
    // Log connection attempt with audioTrack details
    if (audioTrack) {
      console.log("[WebRTCConnectionEstablisher] Establishing connection with audio track:", {
        id: audioTrack.id,
        kind: audioTrack.kind,
        label: audioTrack.label,
        enabled: audioTrack.enabled,
        muted: audioTrack.muted,
        readyState: audioTrack.readyState
      });
    } else {
      console.log("[WebRTCConnectionEstablisher] Establishing connection without audio track");
    }
    
    try {
      return await this.connectionEstablisher.establish(apiKey, options, callbacks, audioTrack);
    } catch (error) {
      console.error("[WebRTCConnectionEstablisher] Connection establishment failed:", error);
      onError(error);
      return null;
    }
  }

  /**
   * Cleanup resources
   */
  cleanup(): void {
    // No need to do anything here as the ConnectionEstablisher handles cleanup
    // during the connection process if errors occur
    console.log("[WebRTCConnectionEstablisher] Cleanup called");
  }
}
