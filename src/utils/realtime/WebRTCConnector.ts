
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
  }

  /**
   * Initialize and connect to OpenAI's Realtime API using WebRTC
   */
  async connect(): Promise<boolean> {
    try {
      console.log("[WebRTC] Initializing connection");
      
      // Create peer connection and set up listeners
      this.pc = createPeerConnection();
      
      if (!this.pc) {
        throw new Error("Failed to create peer connection");
      }
      
      setupPeerConnectionListeners(this.pc, this.options, (state) => {
        this.connectionState = state;
      });
      
      // Create data channel for sending/receiving events
      this.dc = this.pc.createDataChannel("oai-events");
      setupDataChannelListeners(this.dc, this.options);
      
      // Create an offer and set local description
      const offer = await this.pc.createOffer();
      await this.pc.setLocalDescription(offer);
      
      // Send offer to OpenAI using secure API client
      return await withSecureOpenAI(async (apiKey) => {
        try {
          if (!this.pc || !this.pc.localDescription) {
            throw new Error("No valid local description available");
          }
          
          console.log("[WebRTC] Sending offer to OpenAI");
          
          // Send the offer to OpenAI and get answer
          const result = await sendOffer(this.pc.localDescription, apiKey, this.options.model || "");
          
          console.log("[WebRTC] Received answer:", result.success ? "Success" : "Failed");
          
          if (!result.success) {
            throw new Error(result.error || "Failed to send offer");
          }
          
          // Set remote description from OpenAI response
          await this.pc.setRemoteDescription(result.answer);
          
          console.log("[WebRTC] Connection established successfully");
          
          // Configure the session after connection is established
          setTimeout(() => {
            if (this.dc) {
              configureSession(this.dc, this.options);
            }
          }, 1000);
          
          return true;
        } catch (error) {
          console.error("[WebRTC] Error connecting to OpenAI:", error);
          this.handleError(error);
          return false;
        }
      });
    } catch (error) {
      console.error("[WebRTC] Error initializing connection:", error);
      this.handleError(error);
      return false;
    }
  }

  /**
   * Send a text message to OpenAI
   */
  sendTextMessage(text: string): boolean {
    if (!this.dc) {
      console.error("[WebRTC] Data channel not available");
      return false;
    }
    
    try {
      return sendTextMessage(this.dc, text);
    } catch (error) {
      console.error("[WebRTC] Error sending message:", error);
      this.handleError(error);
      return false;
    }
  }

  /**
   * Send audio data to OpenAI
   */
  sendAudioData(audioData: Float32Array): boolean {
    if (!this.dc) {
      console.error("[WebRTC] Data channel not available");
      return false;
    }
    
    try {
      return sendAudioData(this.dc, audioData, encodeAudioData);
    } catch (error) {
      console.error("[WebRTC] Error sending audio data:", error);
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
    console.log("[WebRTC] Disconnecting");
    
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
    
    if (this.options.onError) {
      this.options.onError(new Error(errorMessage));
    }
  }
}
