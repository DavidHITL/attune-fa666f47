import { WebRTCOptions } from "../WebRTCTypes";
import { ConnectionBase } from "./ConnectionBase";
import { WebRTCConnectionEstablisher } from "./WebRTCConnectionEstablisher";
import { ConnectionStateManager } from "./ConnectionStateManager";
import { DataChannelHandler } from "./DataChannelHandler";
import { ConnectionReconnectionHandler } from "./ConnectionReconnectionHandler";
import { IConnectionManager } from "./interfaces/IConnectionManager";
import { ConnectionTimeoutManager } from "./ConnectionTimeoutManager";
import { AudioPlaybackManager } from "../audio/AudioPlaybackManager";
import { AudioConnectionManager } from "./audioManagement/AudioConnectionManager";
import { MessageSender } from "./messaging/MessageSender";
import { SessionConfigManager } from "./session/SessionConfigManager";

export class WebRTCConnectionManager extends ConnectionBase implements IConnectionManager {
  private connectionEstablisher: WebRTCConnectionEstablisher;
  private connectionStateManager: ConnectionStateManager;
  private dataChannelHandler: DataChannelHandler;
  private reconnectionHandler: ConnectionReconnectionHandler;
  private timeoutManager: ConnectionTimeoutManager;
  private audioManager: AudioConnectionManager;
  private messageSender: MessageSender;
  private sessionManager: SessionConfigManager;
  private sessionConfigured: boolean = false;
  
  constructor(options: WebRTCOptions) {
    super(options);
    
    this.connectionEstablisher = new WebRTCConnectionEstablisher();
    this.connectionStateManager = new ConnectionStateManager();
    this.dataChannelHandler = new DataChannelHandler();
    this.reconnectionHandler = new ConnectionReconnectionHandler(options);
    this.timeoutManager = new ConnectionTimeoutManager();
    this.audioManager = new AudioConnectionManager();
    this.messageSender = new MessageSender();
    this.sessionManager = new SessionConfigManager();
    
    console.log("[WebRTCConnectionManager] Initialized with options:", 
      JSON.stringify({
        model: options.model,
        voice: options.voice,
        hasInstructions: !!options.instructions,
        userId: options.userId ? `${options.userId.substring(0, 8)}...` : 'none',
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
   * Set the audio playback manager
   */
  setAudioPlaybackManager(manager: AudioPlaybackManager): void {
    this.audioManager.setAudioPlaybackManager(manager);
    this.sessionManager.setAudioPlaybackManager(manager);
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
    this.timeoutManager.clearTimeout();
    this.dataChannelHandler.setDataChannelReady(false);
    this.sessionConfigured = false;
    
    // Store user context info in the data channel handler for Phase 2 loading
    if (this.options.userId && this.options.instructions) {
      console.log("[WebRTCConnectionManager] [UserContext] Setting userId and instructions for Phase 2 context loading");
      console.log(`[WebRTCConnectionManager] [UserContext] User ID: ${this.options.userId}`);
      this.dataChannelHandler.setUserId(this.options.userId);
      this.dataChannelHandler.setBaseInstructions(this.options.instructions);
      // Reset the context update status
      this.dataChannelHandler.resetContextUpdateStatus();
    } else {
      console.log("[WebRTCConnectionManager] [UserContext] No userId available for context loading");
    }
    
    // Store the audio track for potential reconnection
    if (audioTrack) {
      console.log("[WebRTCConnectionManager] [AudioTrack] Setting audio track for connection:", 
        audioTrack ? `${audioTrack.label} (${audioTrack.id})` : "none");
    } else {
      console.log("[WebRTCConnectionManager] [AudioTrack] No audio track provided");
    }
    this.reconnectionHandler.setAudioTrack(audioTrack);
    
    try {
      console.log("[WebRTCConnectionManager] Establishing connection through ConnectionEstablisher");
      
      // Setup data channel open callback before establishing connection
      this.dataChannelHandler.setOnDataChannelOpen(() => {
        console.log("[WebRTCConnectionManager] Data channel open callback triggered");
        this.configureSessionWhenReady();
      });
      
      const connection = await this.connectionEstablisher.establish(
        apiKey,
        this.options,
        (state) => this.handleConnectionStateChange(state),
        () => {
          // This will be called when the data channel opens
          console.log("[WebRTCConnectionManager] [DataChannelOpen] Data channel is open and ready");
          this.dataChannelHandler.setDataChannelReady(true);
          // No need to call configureSessionWhenReady here as it's now handled in the onDataChannelOpen callback
        },
        this.handleError.bind(this),
        audioTrack // Pass the audioTrack to the connection establisher
      );
      
      if (!connection) {
        console.error("[WebRTCConnectionManager] [ConnectionError] Failed to establish connection");
        return false;
      }
      
      console.log("[WebRTCConnectionManager] Setting peer connection and data channel");
      this.connectionStateManager.setPeerConnection(connection.pc);
      this.dataChannelHandler.setDataChannel(connection.dc, this.handleError.bind(this));
      
      console.log("[WebRTCConnectionManager] WebRTC connection established successfully");
      return true;
    } catch (error) {
      console.error("[WebRTCConnectionManager] [ConnectionError] Error connecting to OpenAI:", error);
      this.handleError(error);
      return false;
    }
  }

  /**
   * Handle connection state changes and trigger reconnection if needed
   * @param state The new connection state
   */
  protected handleConnectionStateChange(state: RTCPeerConnectionState): void {
    console.log("[WebRTCConnectionManager] [ConnectionState] Connection state changed:", state);
    this.connectionStateManager.setConnectionState(state);
    
    // Notify the state change through callback
    if (this.options.onConnectionStateChange) {
      this.options.onConnectionStateChange(state);
    }
    
    // Configure the session when connected
    if (state === "connected") {
      console.log("[WebRTCConnectionManager] [ConnectionState] Connection established");
      // Don't configure session here anymore - wait for data channel open event
      // Reset reconnection manager on successful connection
      this.reconnectionHandler.reset();
    } else if (state === "failed" || state === "disconnected") {
      console.error(`[WebRTCConnectionManager] [ConnectionFailure] Connection state: ${state}`);
      
      // Reset session configured flag
      this.sessionConfigured = false;
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
    const dc = this.dataChannelHandler.isChannelReady() ? 
                this.dataChannelHandler.getDataChannel() : 
                null;
    
    // Guard against multiple calls to configure session
    if (this.sessionConfigured) {
      console.log("[WebRTCConnectionManager] Session already configured, skipping");
      return;
    }
    
    if (!pc) {
      console.error("[WebRTCConnectionManager] [ConfigurationError] Cannot configure session: No peer connection available");
      return;
    }
    
    if (!dc) {
      console.error("[WebRTCConnectionManager] [ConfigurationError] Cannot configure session: Data channel not ready");
      return;
    }
    
    if (pc.connectionState !== "connected") {
      console.warn(`[WebRTCConnectionManager] [ConfigurationError] Cannot configure session: Peer connection not connected (state: ${pc.connectionState})`);
      return;
    }
    
    if (dc.readyState !== "open") {
      console.warn(`[WebRTCConnectionManager] [DataChannelError] Cannot configure session: Data channel not open (state: ${dc.readyState})`);
      
      // Setup retry logic with a timeout if the data channel isn't open yet
      const retryTimeout = setTimeout(() => {
        console.log("[WebRTCConnectionManager] Retrying session configuration after timeout");
        this.configureSessionWhenReady();
      }, 1000);
      
      return;
    }
    
    console.log("[WebRTCConnectionManager] All conditions met, configuring session");
    
    // Mark session as configured to prevent duplicate configuration
    this.sessionConfigured = true;
    
    // Configure the session
    this.sessionManager.configureSession(pc, dc, this.options);
    
    // Set up context update after session is configured
    // Moving the context update to the data channel handler
    if (this.options.userId && this.options.instructions) {
      console.log("[WebRTCConnectionManager] Context update criteria met, initiating context update");
      // Use the data channel handler to manage the context update
      this.dataChannelHandler.initiateContextUpdate(dc);
    } else {
      console.log("[WebRTCConnectionManager] No userId or instructions available, skipping context update");
    }
  }

  /**
   * Handle errors in the WebRTC connection
   */
  protected handleError(error: any): void {
    console.error("[WebRTCConnectionManager] [ConnectionError] Error occurred:", error);
    
    // Dispatch custom error event for global handling
    const errorEvent = new CustomEvent("webrtc-error", {
      detail: { error }
    });
    window.dispatchEvent(errorEvent);
    
    // Call the error handler callback if provided
    if (this.options.onError) {
      this.options.onError(error);
    }
  }

  /**
   * Send a text message to OpenAI
   */
  sendTextMessage(text: string): boolean {
    const dataChannel = this.dataChannelHandler.getDataChannel();
    return this.messageSender.sendTextMessage(
      dataChannel, 
      text, 
      this.handleError.bind(this)
    );
  }

  /**
   * Commit the audio buffer to indicate end of speech
   */
  commitAudioBuffer(): boolean {
    const dataChannel = this.dataChannelHandler.getDataChannel();
    return this.messageSender.commitAudioBuffer(
      dataChannel, 
      this.handleError.bind(this)
    );
  }
  
  /**
   * Check if the data channel is ready for sending
   */
  isDataChannelReady(): boolean {
    return this.dataChannelHandler.isChannelReady();
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
    this.timeoutManager.clearTimeout();
    this.connectionEstablisher.cleanup();
    
    // Mark data channel as intentionally closing before we close it
    if (this.dataChannelHandler.getDataChannel()) {
      this.dataChannelHandler.closeDataChannel();
    }
    
    this.dataChannelHandler.setDataChannelReady(false);
    this.dataChannelHandler.cleanup();
    
    // Reset session configuration
    this.sessionManager.reset();
    
    // Clean up connection resources
    this.connectionStateManager.cleanupConnectionResources();
    this.connectionStateManager.setConnectionState("closed");
    
    // Cleanup audio manager
    this.audioManager.cleanup();
    
    // Reset the disconnecting flag after a short delay
    // to avoid race conditions if reconnect is called immediately after disconnect
    setTimeout(() => {
      this.reconnectionHandler.setDisconnecting(false);
    }, 500);
  }
}
