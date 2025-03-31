
import { withSecureOpenAI } from "@/services/api/ephemeralKeyService";
import { WebRTCOptions } from "./WebRTCTypes";
import { setupPeerConnectionListeners } from "./WebRTCConnectionListeners";
import { setupDataChannelListeners } from "./WebRTCDataChannelHandler";
import { configureSession } from "./WebRTCSessionConfig";
import { createPeerConnection } from "./connector/PeerConnectionFactory";
import { sendOffer } from "./connector/OfferService";
import { sendTextMessage, sendAudioData } from "./connector/MessageSender";
import { WebRTCConnectionManager } from "./connector/WebRTCConnectionManager";

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
   */
  async connect(): Promise<boolean> {
    try {
      return await this.connectionManager.connect();
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
