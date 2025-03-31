
import { withSecureOpenAI } from "@/services/api/ephemeralKeyService";
import { setupPeerConnectionListeners } from "./WebRTCConnectionListeners";
import { setupDataChannelListeners } from "./WebRTCDataChannelHandler";
import { encodeAudioData } from "./WebRTCAudioEncoder";
import { configureSession } from "./WebRTCSessionConfig";
import { WebRTCOptions } from "./WebRTCTypes";

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
      
      // Create a new RTCPeerConnection with standard configuration
      this.pc = new RTCPeerConnection({
        iceServers: [{ urls: "stun:stun.l.google.com:19302" }]
      });
      
      // Set up event handlers for the peer connection
      setupPeerConnectionListeners(this.pc, this.options, (state) => {
        this.connectionState = state;
      });
      
      // Create data channel for sending/receiving events
      this.dc = this.pc.createDataChannel("oai-events");
      setupDataChannelListeners(this.dc, this.options);
      
      // Create an offer to start the WebRTC handshake
      const offer = await this.pc.createOffer();
      await this.pc.setLocalDescription(offer);
      
      // Use our ephemeral key system to securely call OpenAI's API
      return await withSecureOpenAI(async (apiKey) => {
        try {
          if (!this.pc || !this.pc.localDescription || !this.pc.localDescription.sdp) {
            throw new Error("No valid local description available");
          }

          console.log("[WebRTC] Sending offer to OpenAI Realtime API");
          
          // Connect to OpenAI's Realtime API with the WebRTC offer
          const baseUrl = "https://api.openai.com/v1/realtime";
          const model = this.options.model;
          
          const sdpResponse = await fetch(`${baseUrl}?model=${model}`, {
            method: "POST",
            body: this.pc.localDescription.sdp,
            headers: {
              "Authorization": `Bearer ${apiKey}`,
              "Content-Type": "application/sdp"
            }
          });

          if (!sdpResponse.ok) {
            const errorText = await sdpResponse.text();
            console.error("[WebRTC] API Error:", errorText);
            throw new Error(`API Error: ${sdpResponse.status} - ${errorText}`);
          }

          // Get the SDP answer from OpenAI
          const sdpAnswer = await sdpResponse.text();
          
          // Create and set the remote description
          const answer: RTCSessionDescriptionInit = {
            type: "answer",
            sdp: sdpAnswer
          };
          
          await this.pc.setRemoteDescription(answer);
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
    if (!this.dc || this.dc.readyState !== "open") {
      console.error("[WebRTC] Data channel not ready, cannot send message");
      return false;
    }

    try {
      // Create and send a text message event
      const messageEvent = {
        type: "conversation.item.create",
        item: {
          type: "message",
          role: "user",
          content: [
            {
              type: "input_text",
              text
            }
          ]
        }
      };

      this.dc.send(JSON.stringify(messageEvent));
      
      // Request a response from OpenAI
      this.dc.send(JSON.stringify({type: "response.create"}));
      return true;
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
    if (!this.dc || this.dc.readyState !== "open") {
      return false;
    }

    try {
      // Encode the audio data to base64
      const encodedAudio = encodeAudioData(audioData);
      
      // Send the audio buffer
      this.dc.send(JSON.stringify({
        type: 'input_audio_buffer.append',
        audio: encodedAudio
      }));
      
      return true;
    } catch (error) {
      console.error("[WebRTC] Error sending audio data:", error);
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
