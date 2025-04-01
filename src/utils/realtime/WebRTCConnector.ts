
import { WebRTCOptions } from "./WebRTCTypes";
import { WebRTCConnectionManager } from "./connector/WebRTCConnectionManager";

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
    const apiKey = process.env.NEXT_PUBLIC_OPENAI_API_KEY;
    if (!apiKey) {
      console.error("[WebRTCConnector] OpenAI API key is required");
      return false;
    }
    return this.connectionManager.connect(apiKey, audioTrack);
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
