
import { AudioPlaybackManager } from "./audio/AudioPlaybackManager";
import { WebRTCOptions } from "./WebRTCTypes";
import { ConnectionManager } from "./connector/managers/ConnectionManager";
import { withSecureOpenAI } from "@/services/api/ephemeralKeyService";

/**
 * WebRTC connector for the OpenAI Realtime API
 */
export class WebRTCConnector {
  private connectionManager: ConnectionManager;
  private options: WebRTCOptions;
  
  constructor(options: WebRTCOptions) {
    this.options = options;
    this.connectionManager = new ConnectionManager(options);
    console.log("[WebRTCConnector] Initialized with options:", {
      model: options.model,
      voice: options.voice,
      hasCallbacks: {
        onMessage: !!options.onMessage,
        onConnectionStateChange: !!options.onConnectionStateChange,
        onError: !!options.onError,
        onTrack: !!options.onTrack
      }
    });
  }

  /**
   * Connect to the OpenAI Realtime API
   */
  async connect(audioTrack?: MediaStreamTrack): Promise<boolean> {
    console.log("[WebRTCConnector] Establishing connection");
    
    try {
      // Use withSecureOpenAI to get an ephemeral token
      return await withSecureOpenAI(async (apiKey) => {
        if (!apiKey) {
          console.error("[WebRTCConnector] [TokenError] Failed to obtain ephemeral token");
          throw new Error("Failed to obtain ephemeral token for OpenAI connection");
        }
        
        console.log("[WebRTCConnector] Got ephemeral token, connecting");
        return await this.connectionManager.connect(apiKey, audioTrack);
      }, {
        model: this.options.model || "gpt-4o-realtime-preview-2024-12-17",
        voice: this.options.voice || "alloy",
        instructions: this.options.instructions || "You are a helpful assistant."
      });
    } catch (error) {
      console.error("[WebRTCConnector] [ConnectionError] Error connecting to OpenAI:", error);
      
      // Propagate the error through the callback if provided
      if (this.options.onError) {
        this.options.onError(error);
      }
      
      return false;
    }
  }

  /**
   * Disconnect from the OpenAI Realtime API
   */
  disconnect(): void {
    console.log("[WebRTCConnector] Disconnecting");
    this.connectionManager.disconnect();
  }

  /**
   * Send a text message to OpenAI
   */
  sendTextMessage(text: string): boolean {
    return this.connectionManager.sendTextMessage(text);
  }

  /**
   * Commit the audio buffer to signal end of speech
   */
  commitAudioBuffer(): boolean {
    return this.connectionManager.commitAudioBuffer();
  }

  /**
   * Get the current connection state
   */
  getConnectionState(): RTCPeerConnectionState {
    return this.connectionManager.getConnectionState();
  }

  /**
   * Check if the data channel is ready
   */
  isDataChannelReady(): boolean {
    return this.connectionManager.isDataChannelReady();
  }

  /**
   * Set the audio playback manager
   */
  setAudioPlaybackManager(manager: AudioPlaybackManager): void {
    this.connectionManager.setAudioPlaybackManager(manager);
  }
}
