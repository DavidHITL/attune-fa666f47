
import { WebRTCOptions } from "../WebRTCTypes";
import { setupPeerConnectionListeners } from "../WebRTCConnectionListeners";
import { setupDataChannelListeners } from "../WebRTCDataChannelHandler";
import { configureSession } from "../WebRTCSessionConfig";
import { createPeerConnection } from "./PeerConnectionFactory";
import { sendOffer } from "./OfferService";
import { sendTextMessage, sendAudioData } from "./MessageSender";
import { withSecureOpenAI } from "@/services/api/ephemeralKeyService";
import { encodeAudioData } from "../WebRTCAudioEncoder";

export class WebRTCConnectionManager {
  private pc: RTCPeerConnection | null = null;
  private dc: RTCDataChannel | null = null;
  private options: WebRTCOptions;
  private connectionState: RTCPeerConnectionState = "new";
  private connectionTimeout: number | null = null;
  private sessionConfigured: boolean = false;
  private reconnectAttempts: number = 0;
  private maxReconnectAttempts: number = 3;
  
  constructor(options: WebRTCOptions) {
    this.options = options;
  }

  /**
   * Initialize and connect to OpenAI's Realtime API using WebRTC
   */
  async connect(): Promise<boolean> {
    console.log("[WebRTCConnectionManager] Starting connection process");
    
    if (this.connectionTimeout) {
      clearTimeout(this.connectionTimeout);
      this.connectionTimeout = null;
    }
    
    // Create peer connection and set up listeners
    this.pc = createPeerConnection();
    
    if (!this.pc) {
      console.error("[WebRTCConnectionManager] Failed to create peer connection");
      throw new Error("Failed to create peer connection");
    }
    
    setupPeerConnectionListeners(this.pc, this.options, (state) => {
      console.log(`[WebRTCConnectionManager] Connection state changed: ${state}`);
      this.connectionState = state;
      
      // Clear timeout if connection is successful
      if (state === "connected" && this.connectionTimeout) {
        clearTimeout(this.connectionTimeout);
        this.connectionTimeout = null;
        
        // Configure the session after connection is established
        this.configureSessionWhenReady();
      }
    });
    
    // Create data channel for sending/receiving events
    console.log("[WebRTCConnectionManager] Creating data channel");
    this.dc = this.pc.createDataChannel("oai-events");
    setupDataChannelListeners(this.dc, this.options, () => {
      // This will be called when the data channel opens
      console.log("[WebRTCConnectionManager] Data channel is open and ready");
      this.configureSessionWhenReady();
    });
    
    // Create an offer and set local description
    console.log("[WebRTCConnectionManager] Creating offer");
    const offer = await this.pc.createOffer();
    await this.pc.setLocalDescription(offer);
    
    console.log("[WebRTCConnectionManager] Local description set");
    
    // Send offer to OpenAI using secure API client
    try {
      return await withSecureOpenAI(async (apiKey) => {
        try {
          if (!this.pc || !this.pc.localDescription) {
            console.error("[WebRTCConnectionManager] No valid local description available");
            throw new Error("No valid local description available");
          }
          
          console.log("[WebRTCConnectionManager] Sending offer to OpenAI");
          
          // Set a timeout for the connection
          this.connectionTimeout = setTimeout(() => {
            console.error("[WebRTCConnectionManager] Connection timeout after 15 seconds");
            if (this.options.onError) {
              this.options.onError(new Error("Connection timeout after 15 seconds"));
            }
            this.disconnect();
          }, 15000) as unknown as number;
          
          // Send the offer to OpenAI and get answer
          const result = await sendOffer(
            this.pc.localDescription, 
            apiKey, 
            this.options.model || "gpt-4o-realtime-preview-2024-12-17"
          );
          
          if (!result.success) {
            console.error(`[WebRTCConnectionManager] Failed to get valid answer: ${result.error}`);
            throw new Error(result.error || "Failed to send offer");
          }
          
          console.log("[WebRTCConnectionManager] Setting remote description from answer");
          
          try {
            // Set remote description from OpenAI response
            await this.pc.setRemoteDescription(result.answer);
            
            console.log("[WebRTCConnectionManager] Remote description set successfully");
            console.log("[WebRTCConnectionManager] Connection established successfully");
            
            return true;
          } catch (sdpError) {
            console.error("[WebRTCConnectionManager] Error setting remote description:", sdpError);
            throw new Error(`Failed to set remote description: ${sdpError instanceof Error ? sdpError.message : String(sdpError)}`);
          }
        } catch (error) {
          console.error("[WebRTCConnectionManager] Error connecting to OpenAI:", error);
          this.handleError(error);
          return false;
        }
      });
    } catch (error) {
      console.error("[WebRTCConnectionManager] Error in withSecureOpenAI:", error);
      this.handleError(error);
      return false;
    }
  }

  /**
   * Configure the session but only when both the peer connection is connected
   * and the data channel is open
   */
  private configureSessionWhenReady() {
    // Don't configure more than once
    if (this.sessionConfigured) {
      return;
    }

    // Check if connection and data channel are ready
    if (this.pc?.connectionState === 'connected' && this.dc?.readyState === 'open') {
      console.log("[WebRTCConnectionManager] Both connection and data channel ready, configuring session");
      this.sessionConfigured = true;
      configureSession(this.dc, this.options);
    } else {
      console.log(`[WebRTCConnectionManager] Not yet ready to configure session. Connection: ${this.pc?.connectionState}, DataChannel: ${this.dc?.readyState}`);
    }
  }

  /**
   * Send a text message to OpenAI
   */
  sendTextMessage(text: string): boolean {
    if (!this.dc) {
      console.error("[WebRTCConnectionManager] Data channel not available for sending text");
      return false;
    }
    
    if (this.dc.readyState !== "open") {
      console.error(`[WebRTCConnectionManager] Data channel not open, current state: ${this.dc.readyState}`);
      return false;
    }
    
    try {
      return sendTextMessage(this.dc, text);
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
    if (!this.dc) {
      console.error("[WebRTCConnectionManager] Data channel not available for sending audio");
      return false;
    }
    
    if (this.dc.readyState !== "open") {
      console.error(`[WebRTCConnectionManager] Data channel not open for audio, current state: ${this.dc.readyState}`);
      return false;
    }
    
    try {
      return sendAudioData(this.dc, audioData, encodeAudioData);
    } catch (error) {
      console.error("[WebRTCConnectionManager] Error sending audio data:", error);
      this.handleError(error);
      return false;
    }
  }

  /**
   * Get the current connection state
   */
  getConnectionState(): RTCPeerConnectionState {
    return this.connectionState;
  }

  /**
   * Disconnect from the OpenAI Realtime API
   */
  disconnect(): void {
    console.log("[WebRTCConnectionManager] Disconnecting");
    
    // Clear any pending timeout
    if (this.connectionTimeout) {
      clearTimeout(this.connectionTimeout);
      this.connectionTimeout = null;
    }
    
    // Reset session configuration flag
    this.sessionConfigured = false;
    
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

  /**
   * Handle errors from the WebRTC connection
   */
  handleError(error: unknown): void {
    const errorMessage = error instanceof Error ? error.message : String(error);
    
    console.error("[WebRTCConnectionManager] Error:", errorMessage);
    
    if (this.options.onError) {
      this.options.onError(new Error(errorMessage));
    }
  }
}
