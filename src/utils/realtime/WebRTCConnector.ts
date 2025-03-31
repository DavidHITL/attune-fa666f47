
import { withSecureOpenAI } from "@/services/api/ephemeralKeyService";
import { WebRTCOptions } from "./WebRTCTypes";
import { setupPeerConnectionListeners } from "./WebRTCConnectionListeners";
import { setupDataChannelListeners } from "./WebRTCDataChannelHandler";
import { encodeAudioData } from "./WebRTCAudioEncoder";
import { configureSession } from "./WebRTCSessionConfig";
import { createPeerConnection } from "./connector/PeerConnectionFactory";
import { sendOffer } from "./connector/OfferService";
import { sendTextMessage, sendAudioData } from "./connector/MessageSender";

export class WebRTCConnector {
  private pc: RTCPeerConnection | null = null;
  private dc: RTCDataChannel | null = null;
  private options: WebRTCOptions;
  private connectionState: RTCPeerConnectionState = "new";
  
  constructor(options: WebRTCOptions = {}) {
    this.options = {
      model: "gpt-4o-realtime-preview-2024-12-17",
      voice: "alloy",
      instructions: "You are a helpful assistant. Be concise in your responses.",
      ...options
    };
    
    console.log("[WebRTCConnector] Initialized with options:", 
      JSON.stringify({
        model: this.options.model,
        voice: this.options.voice,
        hasInstructions: !!this.options.instructions,
        hasCallbacks: {
          onMessage: !!this.options.onMessage,
          onConnectionStateChange: !!this.options.onConnectionStateChange,
          onError: !!this.options.onError,
          onTrack: !!this.options.onTrack
        }
      })
    );
  }

  /**
   * Initialize and connect to OpenAI's Realtime API using WebRTC
   */
  async connect(): Promise<boolean> {
    try {
      console.log("[WebRTCConnector] Starting connection process");
      
      // Create peer connection and set up listeners
      this.pc = createPeerConnection();
      
      if (!this.pc) {
        console.error("[WebRTCConnector] Failed to create peer connection");
        throw new Error("Failed to create peer connection");
      }
      
      setupPeerConnectionListeners(this.pc, this.options, (state) => {
        console.log(`[WebRTCConnector] Connection state changed: ${state}`);
        this.connectionState = state;
      });
      
      // Create data channel for sending/receiving events
      console.log("[WebRTCConnector] Creating data channel");
      this.dc = this.pc.createDataChannel("oai-events");
      setupDataChannelListeners(this.dc, this.options);
      
      // Create an offer and set local description
      console.log("[WebRTCConnector] Creating offer");
      const offer = await this.pc.createOffer();
      await this.pc.setLocalDescription(offer);
      
      console.log("[WebRTCConnector] Local description set");
      
      // Send offer to OpenAI using secure API client
      return await withSecureOpenAI(async (apiKey) => {
        try {
          if (!this.pc || !this.pc.localDescription) {
            console.error("[WebRTCConnector] No valid local description available");
            throw new Error("No valid local description available");
          }
          
          console.log("[WebRTCConnector] Sending offer to OpenAI");
          
          // Send the offer to OpenAI and get answer
          const result = await sendOffer(
            this.pc.localDescription, 
            apiKey, 
            this.options.model || "gpt-4o-realtime-preview-2024-12-17"
          );
          
          if (!result.success) {
            console.error(`[WebRTCConnector] Failed to get valid answer: ${result.error}`);
            throw new Error(result.error || "Failed to send offer");
          }
          
          console.log("[WebRTCConnector] Setting remote description from answer");
          
          try {
            // Set remote description from OpenAI response
            await this.pc.setRemoteDescription(result.answer);
            
            console.log("[WebRTCConnector] Remote description set successfully");
            console.log("[WebRTCConnector] Connection established successfully");
            
            // Configure the session after connection is established
            setTimeout(() => {
              if (this.dc && this.dc.readyState === "open") {
                console.log("[WebRTCConnector] Configuring session");
                configureSession(this.dc, this.options);
              } else {
                console.warn(`[WebRTCConnector] Data channel not ready for session config, state: ${this.dc?.readyState}`);
              }
            }, 1000);
            
            return true;
          } catch (sdpError) {
            console.error("[WebRTCConnector] Error setting remote description:", sdpError);
            throw new Error(`Failed to set remote description: ${sdpError instanceof Error ? sdpError.message : String(sdpError)}`);
          }
        } catch (error) {
          console.error("[WebRTCConnector] Error connecting to OpenAI:", error);
          this.handleError(error);
          return false;
        }
      });
    } catch (error) {
      console.error("[WebRTCConnector] Error initializing connection:", error);
      this.handleError(error);
      return false;
    }
  }

  /**
   * Send a text message to OpenAI
   */
  sendTextMessage(text: string): boolean {
    if (!this.dc) {
      console.error("[WebRTCConnector] Data channel not available");
      return false;
    }
    
    try {
      return sendTextMessage(this.dc, text);
    } catch (error) {
      console.error("[WebRTCConnector] Error sending message:", error);
      this.handleError(error);
      return false;
    }
  }

  /**
   * Send audio data to OpenAI
   */
  sendAudioData(audioData: Float32Array): boolean {
    if (!this.dc) {
      console.error("[WebRTCConnector] Data channel not available");
      return false;
    }
    
    try {
      return sendAudioData(this.dc, audioData, encodeAudioData);
    } catch (error) {
      console.error("[WebRTCConnector] Error sending audio data:", error);
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
    console.log("[WebRTCConnector] Disconnecting");
    
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
  private handleError(error: unknown): void {
    const errorMessage = error instanceof Error ? error.message : String(error);
    
    console.error("[WebRTCConnector] Error:", errorMessage);
    
    if (this.options.onError) {
      this.options.onError(new Error(errorMessage));
    }
  }
}
