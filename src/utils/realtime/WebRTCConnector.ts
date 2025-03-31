
import { WebRTCOptions } from "./WebRTCTypes";
import { WebRTCConnectionManager } from "./connector/WebRTCConnectionManager";
import { withSecureOpenAI } from "@/services/api/ephemeralKeyService";

export class WebRTCConnector {
  private connectionManager: WebRTCConnectionManager;
  
  constructor(options: WebRTCOptions = {}) {
    const defaultOptions: WebRTCOptions = {
      model: "gpt-4o-realtime-preview-2024-12-17",
      voice: "alloy",
      instructions: "You are a helpful assistant. Be concise in your responses."
    };
    
    // Merge default options with provided options
    const mergedOptions = { ...defaultOptions, ...options };
    
    this.connectionManager = new WebRTCConnectionManager(mergedOptions);
    
    console.log("[WebRTCConnector] Initialized with options:", 
      JSON.stringify({
        model: mergedOptions.model,
        voice: mergedOptions.voice,
        hasInstructions: !!mergedOptions.instructions,
        hasCallbacks: {
          onMessage: !!mergedOptions.onMessage,
          onConnectionStateChange: !!mergedOptions.onConnectionStateChange,
          onError: !!mergedOptions.onError,
          onTrack: !!mergedOptions.onTrack
        }
      })
    );
  }

  /**
   * Initialize and connect to OpenAI's Realtime API using WebRTC
   * @param audioTrack Optional MediaStreamTrack to add to the peer connection
   */
  async connect(audioTrack?: MediaStreamTrack): Promise<boolean> {
    try {
      // Use withSecureOpenAI to get an ephemeral token and establish connection
      return await withSecureOpenAI(
        async (apiKey) => {
          try {
            console.log("[WebRTCConnector] Got ephemeral key, connecting to OpenAI Realtime API");
            
            // Pass the audioTrack to the connection manager
            // This will be added to the peer connection before creating the offer
            return await this.connectionManager.connect(apiKey, audioTrack);
          } catch (error) {
            console.error("[WebRTCConnector] Error connecting with ephemeral key:", error);
            throw error;
          }
        },
        {
          model: this.connectionManager.getOptions().model,
          voice: this.connectionManager.getOptions().voice,
          instructions: this.connectionManager.getOptions().instructions
        }
      );
    } catch (error) {
      console.error("[WebRTCConnector] Error in connect:", error);
      this.connectionManager.handleError(error);
      return false;
    }
  }

  /**
   * Send a text message to OpenAI
   */
  sendTextMessage(text: string): boolean {
    return this.connectionManager.sendTextMessage(text);
  }

  /**
   * Send audio data to OpenAI
   */
  sendAudioData(audioData: Float32Array): boolean {
    return this.connectionManager.sendAudioData(audioData);
  }

  /**
   * Get the current connection state
   */
  getConnectionState(): RTCPeerConnectionState {
    return this.connectionManager.getConnectionState();
  }

  /**
   * Disconnect from the OpenAI Realtime API
   */
  disconnect(): void {
    this.connectionManager.disconnect();
  }
}
