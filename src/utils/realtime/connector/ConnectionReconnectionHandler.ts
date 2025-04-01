
import { WebRTCOptions } from "../WebRTCTypes";
import { ReconnectionManager } from "./ReconnectionManager";
import { withSecureOpenAI } from "@/services/api/ephemeralKeyService";

/**
 * Handler for connection reconnection logic
 */
export class ConnectionReconnectionHandler {
  private reconnectionManager: ReconnectionManager;
  private isDisconnecting: boolean = false;
  private lastAudioTrack: MediaStreamTrack | null = null;
  private options: WebRTCOptions;

  constructor(options: WebRTCOptions) {
    this.options = options;
    this.reconnectionManager = new ReconnectionManager();
  }

  /**
   * Handle connection state changes and trigger reconnection if needed
   * @param state The new connection state
   * @param reconnectCallback The function to call for reconnection
   */
  handleConnectionStateChange(
    state: RTCPeerConnectionState, 
    reconnectCallback: (apiKey: string, audioTrack?: MediaStreamTrack) => Promise<boolean>
  ): void {
    // If we're already in the process of disconnecting, don't try to reconnect
    if (this.isDisconnecting) {
      console.log("[ConnectionReconnectionHandler] Already disconnecting, skipping reconnection");
      return;
    }
    
    // Handle disconnection or failure with automatic reconnection
    if (state === "disconnected" || state === "failed") {
      console.log(`[ConnectionReconnectionHandler] Connection ${state}, attempting reconnection...`);
      
      this.reconnectionManager.scheduleReconnect(async () => {
        // Obtain a new ephemeral token and reconnect
        return await this.attemptReconnection(reconnectCallback);
      });
    }
  }

  /**
   * Attempt to reconnect with a new ephemeral token
   * @returns Promise<boolean> indicating if reconnection was successful
   */
  private async attemptReconnection(
    reconnectCallback: (apiKey: string, audioTrack?: MediaStreamTrack) => Promise<boolean>
  ): Promise<boolean> {
    console.log("[ConnectionReconnectionHandler] Attempting reconnection with a new ephemeral token");
    
    try {
      // Get a new ephemeral key and reconnect
      return await withSecureOpenAI(async (apiKey) => {
        if (!apiKey) {
          console.error("[ConnectionReconnectionHandler] Failed to get ephemeral key for reconnection");
          return false;
        }
        
        console.log("[ConnectionReconnectionHandler] Reconnecting with fresh ephemeral API key");
        return reconnectCallback(apiKey, this.lastAudioTrack || undefined);
      }, {
        model: this.options.model,
        voice: this.options.voice,
        instructions: this.options.instructions
      });
    } catch (error) {
      console.error("[ConnectionReconnectionHandler] Error during reconnection:", error);
      return false;
    }
  }
  
  /**
   * Store audio track for potential reconnection
   */
  setAudioTrack(audioTrack?: MediaStreamTrack): void {
    if (audioTrack) {
      this.lastAudioTrack = audioTrack;
    }
  }
  
  /**
   * Set disconnecting flag
   */
  setDisconnecting(isDisconnecting: boolean): void {
    this.isDisconnecting = isDisconnecting;
  }
  
  /**
   * Reset reconnection manager
   */
  reset(): void {
    this.reconnectionManager.reset();
  }
  
  /**
   * Check if currently disconnecting
   */
  isCurrentlyDisconnecting(): boolean {
    return this.isDisconnecting;
  }
}
