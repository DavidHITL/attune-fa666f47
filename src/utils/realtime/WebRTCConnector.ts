
import { WebRTCOptions } from "./WebRTCTypes";
import { WebRTCConnectionManager } from "./connector/WebRTCConnectionManager";
import { withSecureOpenAI } from "@/services/api/ephemeralKeyService";
import { IConnectionManager } from "./connector/interfaces/IConnectionManager";
import { AudioPlaybackManager } from "./audio/AudioPlaybackManager";
import { toast } from "sonner";

/**
 * Main class for handling WebRTC connections to OpenAI's API
 */
export class WebRTCConnector {
  private connectionManager: IConnectionManager;
  private connectionInProgress: boolean = false;

  constructor(options: WebRTCOptions) {
    // Validate userId if provided
    if (options.userId !== undefined && (!options.userId || options.userId.trim() === '')) {
      console.warn("[WebRTCConnector] Invalid userId provided (empty string) - will proceed without user context");
      options.userId = undefined;
    }
    
    if (options.userId) {
      console.log(`[WebRTCConnector] Initializing with userId: ${options.userId.substring(0, 8)}...`);
    } else {
      console.log("[WebRTCConnector] Initializing without userId (guest mode)");
    }
    
    this.connectionManager = new WebRTCConnectionManager(options);
  }

  /**
   * Initialize and connect to OpenAI's Realtime API
   * @param audioTrack Optional MediaStreamTrack to add to the peer connection
   */
  async connect(audioTrack?: MediaStreamTrack): Promise<boolean> {
    try {
      // Prevent multiple simultaneous connection attempts
      if (this.connectionInProgress) {
        console.warn("[WebRTCConnector] Connection already in progress, ignoring duplicate request");
        return false;
      }
      
      this.connectionInProgress = true;
      
      try {
        // Use the ephemeral key service to get a secure API key with proper await
        return await withSecureOpenAI(async (apiKey) => {
          if (!apiKey) {
            console.error("[WebRTCConnector] OpenAI API key is required");
            toast.error("Connection failed: No API key available");
            return false;
          }
          
          console.log("[WebRTCConnector] Connecting with ephemeral API key");
          
          // Log userId for debugging connection issues
          const options = this.getOptions();
          if (options.userId) {
            console.log(`[WebRTCConnector] Using userId in connection: ${options.userId.substring(0, 8)}...`);
          } else {
            console.log("[WebRTCConnector] Connecting without userId (guest mode)");
          }
          
          const success = await this.connectionManager.connect(apiKey, audioTrack);
          
          if (!success) {
            console.error("[WebRTCConnector] Connection failed");
            toast.error("Connection to AI failed. Please try again.");
          }
          
          return success;
        }, {
          model: this.getOptions().model,
          voice: this.getOptions().voice,
          instructions: this.getOptions().instructions,
          userId: this.getOptions().userId
        });
      } finally {
        // Always reset the connection flag regardless of outcome
        this.connectionInProgress = false;
      }
    } catch (error) {
      this.connectionInProgress = false;
      console.error("[WebRTCConnector] Error connecting:", error);
      toast.error("Connection error. Please try again later.");
      return false;
    }
  }

  /**
   * Get the options used to initialize this connector
   */
  getOptions(): WebRTCOptions {
    // Type assertion to access the getOptions method on WebRTCConnectionManager
    return (this.connectionManager as WebRTCConnectionManager).getOptions();
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

  /**
   * Set the audio playback manager
   * @param manager AudioPlaybackManager instance
   */
  setAudioPlaybackManager(manager: AudioPlaybackManager): void {
    if (this.connectionManager instanceof WebRTCConnectionManager) {
      this.connectionManager.setAudioPlaybackManager(manager);
    }
  }
}
