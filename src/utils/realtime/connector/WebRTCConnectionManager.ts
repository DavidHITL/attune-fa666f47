
import { WebRTCOptions } from "../WebRTCTypes";
import { setupPeerConnectionListeners } from "../WebRTCConnectionListeners";
import { setupDataChannelListeners } from "../WebRTCDataChannelHandler";
import { createPeerConnection } from "./PeerConnectionFactory";
import { sendOffer } from "./OfferService";
import { withSecureOpenAI } from "@/services/api/ephemeralKeyService";
import { ConnectionBase } from "./ConnectionBase";
import { AudioSender } from "./AudioSender";
import { TextMessageSender } from "./TextMessageSender";
import { SessionManager } from "./SessionManager";

export class WebRTCConnectionManager extends ConnectionBase {
  private pc: RTCPeerConnection | null = null;
  private dc: RTCDataChannel | null = null;
  private sessionManager: SessionManager | null = null;
  
  constructor(options: WebRTCOptions) {
    super(options);
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
   * Initialize and connect to OpenAI's Realtime API using WebRTC
   */
  async connect(): Promise<boolean> {
    console.log("[WebRTCConnectionManager] Starting connection process");
    
    this.clearConnectionTimeout();
    
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
        this.clearConnectionTimeout();
        
        // Configure the session after connection is established if data channel is ready
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
    if (!this.dc) {
      console.error("[WebRTCConnectionManager] Data channel not available for sending text");
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
    if (!this.dc) {
      console.error("[WebRTCConnectionManager] Data channel not available for sending audio");
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
   * Disconnect from the OpenAI Realtime API
   */
  disconnect(): void {
    console.log("[WebRTCConnectionManager] Disconnecting");
    
    this.clearConnectionTimeout();
    
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
