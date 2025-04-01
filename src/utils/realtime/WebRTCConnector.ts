
import { WebRTCOptions } from "./WebRTCTypes";
import { WebRTCConnectionManager } from "./connector/WebRTCConnectionManager";
import { withSecureOpenAI } from "@/services/api/ephemeralKeyService";

/**
 * Main class for handling WebRTC connections to OpenAI's API
 */
export class WebRTCConnector {
  private connectionManager: WebRTCConnectionManager;

  constructor(options: WebRTCOptions) {
    this.connectionManager = new WebRTCConnectionManager(options);
  }

  /**
   * Initialize and connect to OpenAI's Realtime API
   * @param audioTrack Optional MediaStreamTrack to add to the peer connection
   */
  async connect(audioTrack?: MediaStreamTrack): Promise<boolean> {
    try {
      // Use the ephemeral key service to get a secure API key
      return await withSecureOpenAI(async (apiKey) => {
        if (!apiKey) {
          console.error("[WebRTCConnector] OpenAI API key is required");
          return false;
        }
        
        console.log("[WebRTCConnector] Connecting with ephemeral API key");
        return this.connectionManager.connect(apiKey, audioTrack);
      }, {
        model: this.connectionManager.getOptions().model,
        voice: this.connectionManager.getOptions().voice,
        instructions: this.connectionManager.getOptions().instructions
      });
    } catch (error) {
      console.error("[WebRTCConnector] Error connecting:", error);
      return false;
    }
  }

  /**
   * Disconnect from the OpenAI Realtime API
   */
  disconnect(): void {
    this.connectionManager.disconnect();
  }

  /**
   * Get the current connection state
   */
  getConnectionState(): RTCPeerConnectionState {
    return this.connectionManager.getConnectionState();
  }

  /**
   * Check if the data channel is ready for sending
   */
  isDataChannelReady(): boolean {
    return this.connectionManager.isDataChannelReady();
  }

  /**
   * Send a text message to OpenAI
   * @param text Text message to send
   * @returns Whether the send was successful
   */
  sendTextMessage(text: string): boolean {
    return this.connectionManager.sendTextMessage(text);
  }
  
  /**
   * Commit the current audio buffer to signal the end of an utterance
   * This tells OpenAI that the current audio segment is complete and ready for processing
   * Note: With direct WebRTC audio track, this is usually not needed as server VAD handles it
   * @returns Whether the commit was successful
   */
  commitAudioBuffer(): boolean {
    return this.connectionManager.commitAudioBuffer();
  }
}
