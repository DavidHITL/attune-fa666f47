import { EventEmitter } from './EventEmitter';
import { supabase } from "@/integrations/supabase/client";

export interface TokenResponse {
  success: boolean;
  client_secret: {
    value: string;
    expires_at: string;
  };
  session_id: string;
  expires_at: string;
  error?: string;
}

export interface AudioDataEvent {
  type: 'audio';
  data: Float32Array;
}

export interface TranscriptEvent {
  type: 'transcript';
  text: string;
  isFinal: boolean;
}

export interface ConnectionStateEvent {
  type: 'connection';
  state: 'connecting' | 'connected' | 'disconnected' | 'failed';
  error?: Error;
}

export type RealtimeEvent = AudioDataEvent | TranscriptEvent | ConnectionStateEvent;

export class DirectOpenAIConnection {
  private eventEmitter = new EventEmitter();
  private pc: RTCPeerConnection | null = null;
  private dc: RTCDataChannel | null = null;
  private audioContext: AudioContext | null = null;
  private audioElement: HTMLAudioElement | null = null;
  private tokenExpiryTimeout: number | null = null;
  private pingInterval: number | null = null;
  private reconnectTimeout: number | null = null;
  private tokenResponse: TokenResponse | null = null;
  
  private transcript = '';
  private isConnected = false;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 3;
  
  constructor() {
    this.audioElement = document.createElement('audio');
    this.audioElement.autoplay = true;
    
    // Try to create AudioContext
    try {
      this.audioContext = new AudioContext({
        sampleRate: 24000, // Required sample rate for OpenAI
      });
    } catch (e) {
      console.error("Failed to initialize AudioContext:", e);
    }
  }

  /**
   * Request a token from Supabase Edge Function
   */
  private async requestToken(
    instructions = "You are a helpful AI assistant.",
    voice = "alloy"
  ): Promise<TokenResponse> {
    console.log("[DirectOpenAI] Requesting token from Edge Function");
    
    try {
      const { data, error } = await supabase.functions.invoke('generate-realtime-token', {
        body: {
          instructions,
          voice
        }
      });

      if (error) {
        console.error("[DirectOpenAI] Error from Edge Function:", error);
        throw new Error(`Token generation failed: ${error.message}`);
      }

      if (!data.success || !data.client_secret?.value) {
        console.error("[DirectOpenAI] Token generation failed:", data.error);
        throw new Error(data.error || "Failed to generate token");
      }

      console.log("[DirectOpenAI] Received token successfully");
      return data as TokenResponse;
      
    } catch (error) {
      console.error("[DirectOpenAI] Token request failed:", error);
      throw error;
    }
  }

  /**
   * Connect to OpenAI's Realtime API using WebRTC
   */
  async connect(
    instructions = "You are a helpful AI assistant.",
    voice = "alloy"
  ): Promise<void> {
    console.log("[DirectOpenAI] Initiating connection");
    
    try {
      // Dispatch connecting event
      this.dispatchEvent({
        type: 'connection',
        state: 'connecting'
      });
      
      // Request new token
      this.tokenResponse = await this.requestToken(instructions, voice);
      const EPHEMERAL_KEY = this.tokenResponse.client_secret.value;
      
      // Set token expiry handler
      const tokenExpiryDate = new Date(this.tokenResponse.client_secret.expires_at);
      const timeUntilExpiry = tokenExpiryDate.getTime() - Date.now();
      
      // Clear any existing timeout
      if (this.tokenExpiryTimeout) {
        clearTimeout(this.tokenExpiryTimeout);
      }
      
      // Set new timeout to reconnect shortly before token expires
      this.tokenExpiryTimeout = setTimeout(() => {
        console.log("[DirectOpenAI] Token expiring soon, reconnecting");
        this.reconnect(instructions, voice);
      }, timeUntilExpiry - 30000) as unknown as number; // Reconnect 30 seconds before expiry
      
      // Create peer connection
      this.pc = new RTCPeerConnection();
      
      // Set up data channel for events
      this.setupDataChannel();
      
      // Set up audio tracks
      this.setupAudioTracks();
      
      // Create and set local description
      const offer = await this.pc.createOffer();
      await this.pc.setLocalDescription(offer);
      
      // Connect to OpenAI's Realtime API
      console.log("[DirectOpenAI] Creating connection with OpenAI");
      const baseUrl = "https://api.openai.com/v1/realtime";
      const model = "gpt-4o-realtime-preview-2024-12-17";
      const sdpResponse = await fetch(`${baseUrl}?model=${model}`, {
        method: "POST",
        body: offer.sdp,
        headers: {
          Authorization: `Bearer ${EPHEMERAL_KEY}`,
          "Content-Type": "application/sdp"
        },
      });
      
      if (!sdpResponse.ok) {
        const errorText = await sdpResponse.text();
        throw new Error(`OpenAI SDP error: ${sdpResponse.status} ${errorText}`);
      }
      
      const answer = {
        type: "answer" as RTCSdpType,
        sdp: await sdpResponse.text(),
      };
      
      await this.pc.setRemoteDescription(answer);
      console.log("[DirectOpenAI] WebRTC connection established");
      
      // Start keepalive ping
      this.startPing();
      
      this.isConnected = true;
      this.reconnectAttempts = 0;
      
      // Dispatch connected event
      this.dispatchEvent({
        type: 'connection',
        state: 'connected'
      });
      
    } catch (error) {
      console.error("[DirectOpenAI] Connection failed:", error);
      
      // Dispatch failed event
      this.dispatchEvent({
        type: 'connection',
        state: 'failed',
        error: error instanceof Error ? error : new Error(String(error))
      });
      
      // Attempt reconnect
      this.handleReconnect(instructions, voice);
      
      throw error;
    }
  }

  /**
   * Set up WebRTC data channel
   */
  private setupDataChannel(): void {
    if (!this.pc) return;
    
    this.dc = this.pc.createDataChannel("oai-events");
    
    this.dc.addEventListener("message", (e) => {
      try {
        const event = JSON.parse(e.data);
        this.handleOpenAIEvent(event);
      } catch (error) {
        console.error("[DirectOpenAI] Error processing message:", error);
      }
    });
    
    this.dc.addEventListener("open", () => {
      console.log("[DirectOpenAI] Data channel opened");
      
      // Send session update once data channel is open
      this.sendSessionUpdate();
    });
    
    this.dc.addEventListener("close", () => {
      console.log("[DirectOpenAI] Data channel closed");
    });
    
    this.dc.addEventListener("error", (error) => {
      console.error("[DirectOpenAI] Data channel error:", error);
    });
  }

  /**
   * Set up audio tracks for WebRTC
   */
  private setupAudioTracks(): void {
    if (!this.pc) return;
    
    // Handle incoming audio streams
    this.pc.ontrack = (event) => {
      console.log("[DirectOpenAI] Received audio track");
      
      if (this.audioElement && event.streams[0]) {
        this.audioElement.srcObject = event.streams[0];
      }
    };
    
    // Add local audio track if possible
    navigator.mediaDevices.getUserMedia({ audio: true })
      .then(stream => {
        stream.getAudioTracks().forEach(track => {
          if (this.pc) {
            this.pc.addTrack(track, stream);
            console.log("[DirectOpenAI] Added local audio track");
          }
        });
      })
      .catch(err => {
        console.error("[DirectOpenAI] Error accessing microphone:", err);
      });
  }

  /**
   * Send session update to configure voice, VAD, etc.
   */
  private sendSessionUpdate(): void {
    if (!this.dc || this.dc.readyState !== 'open') return;
    
    console.log("[DirectOpenAI] Sending session update");
    
    const sessionUpdate = {
      "event_id": `event_${Date.now()}`,
      "type": "session.update",
      "session": {
        "modalities": ["text", "audio"],
        "input_audio_format": "pcm16",
        "output_audio_format": "pcm16",
        "input_audio_transcription": {
          "model": "whisper-1"
        },
        "turn_detection": {
          "type": "server_vad", 
          "threshold": 0.5,
          "prefix_padding_ms": 300,
          "silence_duration_ms": 1000
        },
        "temperature": 0.7,
        "max_response_output_tokens": "inf"
      }   
    };
    
    try {
      this.dc.send(JSON.stringify(sessionUpdate));
    } catch (error) {
      console.error("[DirectOpenAI] Error sending session update:", error);
    }
  }

  /**
   * Send audio data to OpenAI
   */
  sendAudioData(audioData: Float32Array): boolean {
    if (!this.dc || this.dc.readyState !== 'open' || !this.isConnected) {
      return false;
    }
    
    try {
      const base64Audio = this.encodeAudioData(audioData);
      
      const audioEvent = {
        type: 'input_audio_buffer.append',
        audio: base64Audio
      };
      
      this.dc.send(JSON.stringify(audioEvent));
      return true;
    } catch (error) {
      console.error("[DirectOpenAI] Error sending audio data:", error);
      return false;
    }
  }

  /**
   * Send a text message to OpenAI
   */
  sendTextMessage(text: string): boolean {
    if (!this.dc || this.dc.readyState !== 'open' || !this.isConnected) {
      return false;
    }
    
    try {
      console.log("[DirectOpenAI] Sending text message:", text);
      
      // Create and send conversation item
      const messageEvent = {
        type: 'conversation.item.create',
        item: {
          type: 'message',
          role: 'user',
          content: [
            {
              type: 'input_text',
              text
            }
          ]
        }
      };
      
      this.dc.send(JSON.stringify(messageEvent));
      
      // Request response
      this.dc.send(JSON.stringify({type: 'response.create'}));
      
      return true;
    } catch (error) {
      console.error("[DirectOpenAI] Error sending text message:", error);
      return false;
    }
  }

  /**
   * Handle incoming events from OpenAI
   */
  private handleOpenAIEvent(event: any): void {
    // Process based on event type
    switch (event.type) {
      case 'session.created':
        console.log("[DirectOpenAI] Session created:", event.session_id);
        break;
        
      case 'response.audio.delta':
        // OpenAI sends base64 encoded PCM audio
        this.handleAudioDelta(event.delta);
        break;
        
      case 'response.audio_transcript.delta':
        // Update transcript with new text
        this.handleTranscriptDelta(event.delta);
        break;
        
      case 'speech_started':
      case 'response.audio.started':
        console.log("[DirectOpenAI] AI speech started");
        break;
        
      case 'speech_stopped':
      case 'response.audio.done':
        console.log("[DirectOpenAI] AI speech ended");
        break;
        
      case 'ping':
        // Respond to ping with pong
        this.sendPong();
        break;
        
      default:
        // Log other events for debugging
        console.log("[DirectOpenAI] Received event:", event.type);
    }
  }

  /**
   * Handle audio delta from OpenAI
   */
  private handleAudioDelta(base64Audio: string): void {
    // Convert base64 to Float32Array
    try {
      const binaryString = atob(base64Audio);
      const bytes = new Uint8Array(binaryString.length);
      
      for (let i = 0; i < binaryString.length; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }
      
      // Convert to Float32Array for processing
      const float32Data = new Float32Array(bytes.length / 2);
      const dataView = new DataView(bytes.buffer);
      
      for (let i = 0; i < float32Data.length; i++) {
        // Convert from Int16 to Float32
        const int16Value = dataView.getInt16(i * 2, true);
        float32Data[i] = int16Value / 32768.0;
      }
      
      // Dispatch audio data event
      this.dispatchEvent({
        type: 'audio',
        data: float32Data
      });
      
    } catch (error) {
      console.error("[DirectOpenAI] Error processing audio data:", error);
    }
  }

  /**
   * Handle transcript delta from OpenAI
   */
  private handleTranscriptDelta(textDelta: string): void {
    this.transcript += textDelta;
    
    // Dispatch transcript event
    this.dispatchEvent({
      type: 'transcript',
      text: this.transcript,
      isFinal: false
    });
  }

  /**
   * Start ping interval to keep connection alive
   */
  private startPing(): void {
    // Clear any existing interval
    if (this.pingInterval) {
      clearInterval(this.pingInterval);
    }
    
    // Send ping every 30 seconds
    this.pingInterval = setInterval(() => {
      if (this.dc && this.dc.readyState === 'open') {
        this.dc.send(JSON.stringify({
          type: 'ping',
          timestamp: Date.now()
        }));
      }
    }, 30000) as unknown as number;
  }

  /**
   * Send pong response to ping
   */
  private sendPong(): void {
    if (!this.dc || this.dc.readyState !== 'open') return;
    
    try {
      this.dc.send(JSON.stringify({
        type: 'pong',
        timestamp: Date.now()
      }));
    } catch (error) {
      console.error("[DirectOpenAI] Error sending pong:", error);
    }
  }

  /**
   * Reconnect to OpenAI
   */
  private async reconnect(
    instructions = "You are a helpful AI assistant.",
    voice = "alloy"
  ): Promise<void> {
    // Disconnect first
    this.disconnect();
    
    // Clear any existing reconnect timeout
    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout);
      this.reconnectTimeout = null;
    }
    
    try {
      // Connect again
      await this.connect(instructions, voice);
    } catch (error) {
      console.error("[DirectOpenAI] Reconnection failed:", error);
      
      // Handle reconnect attempt
      this.handleReconnect(instructions, voice);
    }
  }

  /**
   * Handle reconnection attempt
   */
  private handleReconnect(
    instructions = "You are a helpful AI assistant.",
    voice = "alloy"
  ): void {
    this.reconnectAttempts++;
    
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      const delay = Math.pow(2, this.reconnectAttempts) * 1000; // Exponential backoff
      
      console.log(`[DirectOpenAI] Will attempt reconnect in ${delay/1000} seconds (attempt ${this.reconnectAttempts})`);
      
      // Schedule reconnect
      this.reconnectTimeout = setTimeout(() => {
        this.reconnect(instructions, voice);
      }, delay) as unknown as number;
    } else {
      console.error(`[DirectOpenAI] Failed to reconnect after ${this.maxReconnectAttempts} attempts`);
      
      // Dispatch disconnected event
      this.dispatchEvent({
        type: 'connection',
        state: 'disconnected'
      });
    }
  }

  /**
   * Disconnect from OpenAI
   */
  disconnect(): void {
    console.log("[DirectOpenAI] Disconnecting");
    
    // Clear intervals and timeouts
    if (this.pingInterval) {
      clearInterval(this.pingInterval);
      this.pingInterval = null;
    }
    
    if (this.tokenExpiryTimeout) {
      clearTimeout(this.tokenExpiryTimeout);
      this.tokenExpiryTimeout = null;
    }
    
    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout);
      this.reconnectTimeout = null;
    }
    
    // Close data channel
    if (this.dc) {
      try {
        this.dc.close();
      } catch (e) {
        // Ignore errors during cleanup
      }
      this.dc = null;
    }
    
    // Close peer connection
    if (this.pc) {
      try {
        this.pc.close();
      } catch (e) {
        // Ignore errors during cleanup
      }
      this.pc = null;
    }
    
    // Clear audio element
    if (this.audioElement) {
      this.audioElement.srcObject = null;
    }
    
    this.isConnected = false;
    
    // Dispatch disconnected event
    this.dispatchEvent({
      type: 'connection',
      state: 'disconnected'
    });
  }

  /**
   * Check if connected to OpenAI
   */
  isConnectedToOpenAI(): boolean {
    return this.isConnected && !!this.dc && this.dc.readyState === 'open';
  }

  /**
   * Convert Float32Array to base64 for sending to API
   */
  private encodeAudioData(float32Array: Float32Array): string {
    // Convert Float32Array to Int16Array
    const int16Array = new Int16Array(float32Array.length);
    for (let i = 0; i < float32Array.length; i++) {
      // Clamp to [-1, 1]
      const s = Math.max(-1, Math.min(1, float32Array[i]));
      // Convert to Int16
      int16Array[i] = s < 0 ? s * 0x8000 : s * 0x7FFF;
    }
    
    // Convert to Uint8Array for transmission
    const uint8Array = new Uint8Array(int16Array.buffer);
    let binary = '';
    const chunkSize = 0x8000;
    
    // Process in chunks to avoid call stack size exceeded
    for (let i = 0; i < uint8Array.length; i += chunkSize) {
      const chunk = uint8Array.subarray(i, Math.min(i + chunkSize, uint8Array.length));
      binary += String.fromCharCode.apply(null, Array.from(chunk));
    }
    
    return btoa(binary);
  }

  /**
   * Add event listener for DirectOpenAI events
   */
  addEventListener(
    callback: (event: RealtimeEvent) => void
  ): () => void {
    const eventId = this.eventEmitter.addEventListener('event', callback);
    
    // Return unsubscribe function
    return () => {
      this.eventEmitter.removeEventListener('event', eventId);
    };
  }

  /**
   * Dispatch event to listeners
   */
  private dispatchEvent(event: RealtimeEvent): void {
    this.eventEmitter.dispatchEvent('event', event);
  }
}
