
import { withSecureOpenAI } from "@/services/api/ephemeralKeyService";

export interface WebRTCOptions {
  onTrack?: (event: RTCTrackEvent) => void;
  onMessage?: (event: MessageEvent) => void;
  onConnectionStateChange?: (state: RTCPeerConnectionState) => void;
  onError?: (error: Error) => void;
  model?: string;
  voice?: "alloy" | "echo" | "fable" | "onyx" | "nova" | "shimmer";
  instructions?: string;
}

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
      this.setupPeerConnectionListeners(this.pc);
      
      // Create data channel for sending/receiving events
      this.dc = this.pc.createDataChannel("oai-events");
      this.setupDataChannelListeners(this.dc);
      
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
          setTimeout(() => this.configureSession(), 1000);
          
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
   * Set up event listeners for the peer connection
   */
  private setupPeerConnectionListeners(pc: RTCPeerConnection): void {
    // Track ICE connection state
    pc.oniceconnectionstatechange = () => {
      console.log("[WebRTC] ICE connection state:", pc.iceConnectionState);
    };
    
    // Handle incoming tracks (audio)
    pc.ontrack = (event) => {
      console.log("[WebRTC] Received track:", event.track.kind);
      if (this.options.onTrack) {
        this.options.onTrack(event);
      }
    };
    
    // Handle connection state changes
    pc.onconnectionstatechange = () => {
      this.connectionState = pc.connectionState;
      console.log("[WebRTC] Connection state changed:", this.connectionState);
      
      if (this.options.onConnectionStateChange) {
        this.options.onConnectionStateChange(this.connectionState);
      }
      
      // Handle disconnection or failure
      if (this.connectionState === "disconnected" || this.connectionState === "failed") {
        console.warn("[WebRTC] Connection lost or failed");
      }
    };
  }

  /**
   * Set up event listeners for the data channel
   */
  private setupDataChannelListeners(dc: RTCDataChannel): void {
    dc.onopen = () => {
      console.log("[WebRTC] Data channel opened");
    };
    
    dc.onclose = () => {
      console.log("[WebRTC] Data channel closed");
    };
    
    dc.onerror = (event) => {
      console.error("[WebRTC] Data channel error:", event);
    };
    
    dc.onmessage = (event) => {
      try {
        // Parse the message and log for debugging
        const message = JSON.parse(event.data);
        console.log("[WebRTC] Received message:", message.type || "unknown type");
        
        // Forward the message to the callback if provided
        if (this.options.onMessage) {
          this.options.onMessage(event);
        }
      } catch (error) {
        console.error("[WebRTC] Error processing message:", error);
      }
    };
  }

  /**
   * Configure the session with OpenAI after connection is established
   */
  private async configureSession(): Promise<void> {
    if (!this.dc || this.dc.readyState !== "open") {
      console.warn("[WebRTC] Data channel not ready, cannot configure session");
      return;
    }

    try {
      // Send session configuration to OpenAI
      const sessionConfig = {
        event_id: `event_${Date.now()}`,
        type: "session.update",
        session: {
          modalities: ["text", "audio"],
          instructions: this.options.instructions,
          voice: this.options.voice,
          input_audio_format: "pcm16",
          output_audio_format: "pcm16",
          input_audio_transcription: {
            model: "whisper-1"
          },
          turn_detection: {
            type: "server_vad",
            threshold: 0.5,
            prefix_padding_ms: 300,
            silence_duration_ms: 1000
          },
          temperature: 0.7,
          max_response_output_tokens: "inf"
        }
      };

      console.log("[WebRTC] Configuring session:", sessionConfig);
      this.dc.send(JSON.stringify(sessionConfig));
    } catch (error) {
      console.error("[WebRTC] Error configuring session:", error);
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
      const encodedAudio = this.encodeAudioData(audioData);
      
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
   * Encode audio data for sending to OpenAI
   */
  private encodeAudioData(float32Array: Float32Array): string {
    const int16Array = new Int16Array(float32Array.length);
    
    // Convert Float32Array to Int16Array
    for (let i = 0; i < float32Array.length; i++) {
      // Clamp values between -1 and 1
      const s = Math.max(-1, Math.min(1, float32Array[i]));
      // Convert to 16-bit PCM
      int16Array[i] = s < 0 ? s * 0x8000 : s * 0x7FFF;
    }
    
    // Convert to Uint8Array for binary encoding
    const uint8Array = new Uint8Array(int16Array.buffer);
    let binary = '';
    const chunkSize = 0x8000;
    
    // Process in chunks to avoid call stack limits
    for (let i = 0; i < uint8Array.length; i += chunkSize) {
      const chunk = uint8Array.subarray(i, Math.min(i + chunkSize, uint8Array.length));
      binary += String.fromCharCode.apply(null, Array.from(chunk));
    }
    
    // Return base64 encoded string
    return btoa(binary);
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
