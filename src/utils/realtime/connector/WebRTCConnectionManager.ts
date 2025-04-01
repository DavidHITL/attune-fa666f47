import { WebRTCOptions } from "../WebRTCTypes";
import { ConnectionBase } from "./ConnectionBase";
import { TextMessageSender } from "./TextMessageSender";
import { SessionManager } from "./SessionManager";
import { WebRTCConnectionEstablisher } from "./WebRTCConnectionEstablisher";
import { AudioSender } from "./AudioSender";
import { withSecureOpenAI } from "@/services/api/ephemeralKeyService";

export class WebRTCConnectionManager extends ConnectionBase {
  private pc: RTCPeerConnection | null = null;
  private dc: RTCDataChannel | null = null;
  private sessionManager: SessionManager | null = null;
  private connectionEstablisher: WebRTCConnectionEstablisher;
  private dataChannelReady: boolean = false;
  private lastAudioTrack: MediaStreamTrack | null = null;
  
  constructor(options: WebRTCOptions) {
    super(options);
    this.connectionEstablisher = new WebRTCConnectionEstablisher();
    
    console.log("[WebRTCConnectionManager] Initialized with options:", 
      JSON.stringify({
        model: options.model,
        voice: options.voice,
        hasInstructions: !!options.instructions,
        hasCallbacks: {
          onMessage: !!options.onMessage,
          onConnectionStateChange: !!options.onConnectionStateChange,
          onError: !!options.onError,
          onTrack: !!options.onTrack
        }
      })
    );
  }

  /**
   * Get the options used to initialize this manager
   */
  getOptions(): WebRTCOptions {
    return this.options;
  }

  /**
   * Initialize and connect to OpenAI's Realtime API using WebRTC
   * @param apiKey Ephemeral API key for authenticating with OpenAI
   * @param audioTrack Optional MediaStreamTrack to add to the peer connection
   */
  async connect(apiKey: string, audioTrack?: MediaStreamTrack): Promise<boolean> {
    console.log("[WebRTCConnectionManager] Starting connection process");
    
    this.clearConnectionTimeout();
    this.dataChannelReady = false;
    
    // Store the audio track for potential reconnection
    if (audioTrack) {
      this.lastAudioTrack = audioTrack;
    }
    
    try {
      const connection = await this.connectionEstablisher.establish(
        apiKey,
        this.options,
        (state) => this.handleConnectionStateChange(state),
        () => {
          // This will be called when the data channel opens
          console.log("[WebRTCConnectionManager] Data channel is open and ready");
          this.dataChannelReady = true;
          this.configureSessionWhenReady();
        },
        this.handleError.bind(this),
        audioTrack // Pass the audioTrack to the connection establisher
      );
      
      if (!connection) {
        console.error("[WebRTCConnectionManager] Failed to establish connection");
        return false;
      }
      
      this.pc = connection.pc;
      this.dc = connection.dc;
      
      console.log("[WebRTCConnectionManager] WebRTC connection established successfully");
      return true;
    } catch (error) {
      console.error("[WebRTCConnectionManager] Error connecting to OpenAI:", error);
      this.handleError(error);
      return false;
    }
  }

  /**
   * Handle connection state changes and trigger reconnection if needed
   * @param state The new connection state
   */
  private handleConnectionStateChange(state: RTCPeerConnectionState): void {
    console.log("[WebRTCConnectionManager] Connection state changed:", state);
    this.connectionState = state;
    
    // Notify the state change through callback
    if (this.options.onConnectionStateChange) {
      this.options.onConnectionStateChange(state);
    }
    
    // Configure the session when connected
    if (state === "connected") {
      this.configureSessionWhenReady();
      // Reset reconnection manager on successful connection
      this.reconnectionManager.reset();
    }
    
    // Handle disconnection or failure with automatic reconnection
    if (this.reconnectionManager.shouldReconnect(state)) {
      console.log(`[WebRTCConnectionManager] Connection ${state}, attempting reconnection...`);
      this.reconnectionManager.scheduleReconnect(async () => {
        // Obtain a new ephemeral token and reconnect
        return await this.attemptReconnection();
      });
    }
  }

  /**
   * Attempt to reconnect with a new ephemeral token
   * @returns Promise<boolean> indicating if reconnection was successful
   */
  private async attemptReconnection(): Promise<boolean> {
    console.log("[WebRTCConnectionManager] Attempting reconnection with a new ephemeral token");
    
    try {
      // Clean up existing connection resources
      if (this.pc) {
        this.pc.close();
        this.pc = null;
      }
      if (this.dc) {
        this.dc.close();
        this.dc = null;
      }
      
      // Reset session state
      if (this.sessionManager) {
        this.sessionManager.resetSessionConfigured();
      }
      
      this.dataChannelReady = false;
      
      // Get a new ephemeral key and reconnect
      return await withSecureOpenAI(async (apiKey) => {
        if (!apiKey) {
          console.error("[WebRTCConnectionManager] Failed to get ephemeral key for reconnection");
          return false;
        }
        
        console.log("[WebRTCConnectionManager] Reconnecting with fresh ephemeral API key");
        return this.connect(apiKey, this.lastAudioTrack || undefined);
      }, {
        model: this.options.model,
        voice: this.options.voice,
        instructions: this.options.instructions
      });
    } catch (error) {
      console.error("[WebRTCConnectionManager] Error during reconnection:", error);
      return false;
    }
  }

  /**
   * Configure the session but only when both the peer connection is connected
   * and the data channel is open
   */
  private configureSessionWhenReady() {
    if (!this.pc || !this.dc) {
      return;
    }
    
    if (!this.sessionManager) {
      this.sessionManager = new SessionManager(this.pc, this.dc, this.options);
    }
    
    this.sessionManager.configureSessionIfReady();
  }

  /**
   * Send a text message to OpenAI
   */
  sendTextMessage(text: string): boolean {
    if (!this.dc || !this.dataChannelReady || this.dc.readyState !== "open") {
      console.error(`[WebRTCConnectionManager] Data channel not ready for sending text, state: ${this.dc?.readyState || 'null'}`);
      return false;
    }
    
    try {
      return TextMessageSender.sendTextMessage(this.dc, text);
    } catch (error) {
      console.error("[WebRTCConnectionManager] Error sending message:", error);
      this.handleError(error);
      return false;
    }
  }

  /**
   * Commit the audio buffer to indicate end of speech
   * Note: With direct audio track approach, this is typically not needed
   * as the server VAD will detect silence, but we keep it for manual control
   */
  commitAudioBuffer(): boolean {
    if (!this.dc || !this.dataChannelReady || this.dc.readyState !== "open") {
      console.error(`[WebRTCConnectionManager] Data channel not ready for committing audio, state: ${this.dc?.readyState || 'null'}`);
      return false;
    }
    
    try {
      console.log("[WebRTCConnectionManager] Committing audio buffer");
      
      // With the direct audio track approach, we now use AudioSender.commitAudioBuffer
      // which handles the specific event format. The force parameter is false by default
      // so it will only commit if audio was actually flowing.
      return AudioSender.commitAudioBuffer(this.dc, false);
    } catch (error) {
      console.error("[WebRTCConnectionManager] Error committing audio buffer:", error);
      this.handleError(error);
      return false;
    }
  }
  
  /**
   * Check if the data channel is ready for sending
   */
  isDataChannelReady(): boolean {
    return this.dataChannelReady && !!this.dc && this.dc.readyState === "open";
  }

  /**
   * Disconnect from the OpenAI Realtime API
   */
  disconnect(): void {
    console.log("[WebRTCConnectionManager] Disconnecting");
    
    // Stop any reconnection attempts
    this.reconnectionManager.reset();
    
    this.clearConnectionTimeout();
    this.connectionEstablisher.cleanup();
    this.dataChannelReady = false;
    
    // Reset session configuration
    if (this.sessionManager) {
      this.sessionManager.resetSessionConfigured();
      this.sessionManager = null;
    }
    
    // Close the data channel if it exists
    if (this.dc) {
      this.dc.close();
      this.dc = null;
    }
    
    // Close the peer connection if it exists
    if (this.pc) {
      this.pc.close();
      this.pc = null;
    }
    
    this.connectionState = "closed";
  }
}
