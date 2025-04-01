
import { WebRTCOptions } from "../WebRTCTypes";
import { ConnectionBase } from "./ConnectionBase";
import { SessionManager } from "./SessionManager";
import { WebRTCConnectionEstablisher } from "./WebRTCConnectionEstablisher";
import { ConnectionStateManager } from "./ConnectionStateManager";
import { DataChannelHandler } from "./DataChannelHandler";
import { ConnectionReconnectionHandler } from "./ConnectionReconnectionHandler";
import { IConnectionManager } from "./interfaces/IConnectionManager";

export class WebRTCConnectionManager extends ConnectionBase implements IConnectionManager {
  private sessionManager: SessionManager | null = null;
  private connectionEstablisher: WebRTCConnectionEstablisher;
  private connectionStateManager: ConnectionStateManager;
  private dataChannelHandler: DataChannelHandler;
  private reconnectionHandler: ConnectionReconnectionHandler;
  
  constructor(options: WebRTCOptions) {
    super(options);
    
    this.connectionEstablisher = new WebRTCConnectionEstablisher();
    this.connectionStateManager = new ConnectionStateManager();
    this.dataChannelHandler = new DataChannelHandler();
    this.reconnectionHandler = new ConnectionReconnectionHandler(options);
    
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
    
    // Reset disconnecting flag when starting a new connection
    this.reconnectionHandler.setDisconnecting(false);
    this.clearConnectionTimeout();
    this.dataChannelHandler.setDataChannelReady(false);
    
    // Store the audio track for potential reconnection
    this.reconnectionHandler.setAudioTrack(audioTrack);
    
    try {
      const connection = await this.connectionEstablisher.establish(
        apiKey,
        this.options,
        (state) => this.handleConnectionStateChange(state),
        () => {
          // This will be called when the data channel opens
          console.log("[WebRTCConnectionManager] Data channel is open and ready");
          this.dataChannelHandler.setDataChannelReady(true);
          this.configureSessionWhenReady();
        },
        this.handleError.bind(this),
        audioTrack // Pass the audioTrack to the connection establisher
      );
      
      if (!connection) {
        console.error("[WebRTCConnectionManager] Failed to establish connection");
        return false;
      }
      
      this.connectionStateManager.setPeerConnection(connection.pc);
      this.dataChannelHandler.setDataChannel(connection.dc, this.handleError.bind(this));
      
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
    this.connectionStateManager.setConnectionState(state);
    
    // Notify the state change through callback
    if (this.options.onConnectionStateChange) {
      this.options.onConnectionStateChange(state);
    }
    
    // Configure the session when connected
    if (state === "connected") {
      this.configureSessionWhenReady();
      // Reset reconnection manager on successful connection
      this.reconnectionHandler.reset();
    }
    
    // Handle disconnection or failure with automatic reconnection
    this.reconnectionHandler.handleConnectionStateChange(
      state, 
      (apiKey, audioTrack) => this.connect(apiKey, audioTrack)
    );
  }

  /**
   * Configure the session but only when both the peer connection is connected
   * and the data channel is open
   */
  private configureSessionWhenReady() {
    const pc = this.connectionStateManager.getPeerConnection();
    const dc = this.dataChannelHandler.isDataChannelReady() ? 
                this.connectionStateManager.getPeerConnection()?.createDataChannel("data") : 
                null;
                
    if (!pc || !dc) {
      return;
    }
    
    if (!this.sessionManager) {
      this.sessionManager = new SessionManager(pc, dc, this.options);
    }
    
    this.sessionManager.configureSessionIfReady();
  }

  /**
   * Send a text message to OpenAI
   */
  sendTextMessage(text: string): boolean {
    return this.dataChannelHandler.sendTextMessage(text, this.handleError.bind(this));
  }

  /**
   * Commit the audio buffer to indicate end of speech
   */
  commitAudioBuffer(): boolean {
    return this.dataChannelHandler.commitAudioBuffer(this.handleError.bind(this));
  }
  
  /**
   * Check if the data channel is ready for sending
   */
  isDataChannelReady(): boolean {
    return this.dataChannelHandler.isDataChannelReady();
  }

  /**
   * Get the current connection state
   */
  getConnectionState(): RTCPeerConnectionState {
    return this.connectionStateManager.getConnectionState();
  }

  /**
   * Disconnect from the OpenAI Realtime API
   */
  disconnect(): void {
    // If already disconnecting, don't repeat the process
    if (this.reconnectionHandler.isCurrentlyDisconnecting()) {
      console.log("[WebRTCConnectionManager] Already disconnecting, ignoring repeat call");
      return;
    }
    
    console.log("[WebRTCConnectionManager] Disconnecting");
    this.reconnectionHandler.setDisconnecting(true);
    
    // Stop any reconnection attempts
    this.reconnectionHandler.reset();
    this.clearConnectionTimeout();
    this.connectionEstablisher.cleanup();
    this.dataChannelHandler.setDataChannelReady(false);
    this.dataChannelHandler.cleanup();
    
    // Reset session configuration
    if (this.sessionManager) {
      this.sessionManager.resetSessionConfigured();
      this.sessionManager = null;
    }
    
    // Clean up data channel
    this.dataChannelHandler.setDataChannel(null);
    
    // Clean up connection resources
    this.connectionStateManager.cleanupConnectionResources();
    this.connectionStateManager.setConnectionState("closed");
    
    // Reset the disconnecting flag after a short delay
    // to avoid race conditions if reconnect is called immediately after disconnect
    setTimeout(() => {
      this.reconnectionHandler.setDisconnecting(false);
    }, 500);
  }
}
