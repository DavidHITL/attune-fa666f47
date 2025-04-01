
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
      // Validate audio track if provided
      if (audioTrack) {
        console.log("[WebRTCConnector] Audio track provided:", 
          audioTrack.label || "Unnamed track", 
          "- Enabled:", audioTrack.enabled,
          "- Ready state:", audioTrack.readyState,
          "- ID:", audioTrack.id);
        
        if (audioTrack.readyState !== 'live') {
          console.warn("[WebRTCConnector] Provided audio track is not in 'live' state:", audioTrack.readyState);
        }
      } else {
        console.log("[WebRTCConnector] No audio track provided, will attempt to get microphone access during connection");
      }
      
      // Use withSecureOpenAI to get an ephemeral token and establish connection
      return await withSecureOpenAI(
        async (apiKey) => {
          try {
            console.log("[WebRTCConnector] Got ephemeral key, connecting to OpenAI Realtime API");
            
            // Pass the audioTrack to the connection manager
            // This will be added to the peer connection before creating the offer
            const result = await this.connectionManager.connect(apiKey, audioTrack);
            
            if (result) {
              console.log("[WebRTCConnector] Successfully connected with audio track");
            } else {
              console.error("[WebRTCConnector] Failed to connect with audio track");
            }
            
            return result;
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
   * Check if the data channel is ready for sending
   */
  isDataChannelReady(): boolean {
    return this.connectionManager.isDataChannelReady();
  }

  /**
   * Disconnect from the OpenAI Realtime API
   */
  disconnect(): void {
    this.connectionManager.disconnect();
  }
}
