
import { WebRTCOptions } from "../WebRTCTypes";
import { ConnectionBase } from "./ConnectionBase";
import { AudioSender } from "./AudioSender";
import { TextMessageSender } from "./TextMessageSender";
import { SessionManager } from "./SessionManager";
import { WebRTCConnectionEstablisher } from "./WebRTCConnectionEstablisher";

export class WebRTCConnectionManager extends ConnectionBase {
  private pc: RTCPeerConnection | null = null;
  private dc: RTCDataChannel | null = null;
  private sessionManager: SessionManager | null = null;
  private connectionEstablisher: WebRTCConnectionEstablisher;
  private dataChannelReady: boolean = false;
  
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
    
    try {
      const connection = await this.connectionEstablisher.establish(
        apiKey,
        this.options,
        (state) => {
          this.connectionState = state;
          
          // Configure the session after connection is established if data channel is ready
          if (state === "connected") {
            this.configureSessionWhenReady();
          }
        },
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
   * Send audio data to OpenAI
   */
  sendAudioData(audioData: Float32Array): boolean {
    if (!this.dc || !this.dataChannelReady || this.dc.readyState !== "open") {
      console.error(`[WebRTCConnectionManager] Data channel not ready for sending audio, state: ${this.dc?.readyState || 'null'}`);
      return false;
    }
    
    try {
      return AudioSender.sendAudioData(this.dc, audioData);
    } catch (error) {
      console.error("[WebRTCConnectionManager] Error sending audio data:", error);
      this.handleError(error);
      return false;
    }
  }
  
  /**
   * Commit the audio buffer to indicate end of speech
   */
  commitAudioBuffer(): boolean {
    if (!this.dc || !this.dataChannelReady || this.dc.readyState !== "open") {
      console.error(`[WebRTCConnectionManager] Data channel not ready for committing audio, state: ${this.dc?.readyState || 'null'}`);
      return false;
    }
    
    try {
      return AudioSender.commitAudioBuffer(this.dc);
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
