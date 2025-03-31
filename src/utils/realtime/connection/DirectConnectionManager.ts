
import { EventEmitter } from '../EventEmitter';
import { RealtimeEvent } from '../types/events';

/**
 * Manages direct connection to OpenAI's Realtime API
 */
export class DirectConnectionManager {
  private websocket: WebSocket | null = null;
  private isConnected = false;
  private eventEmitter: EventEmitter;
  private pingInterval: number | null = null;
  private lastPingTime = 0;
  private audioContext: AudioContext | null = null;
  private audioQueue: Float32Array[] = [];
  private isProcessingAudio = false;
  
  constructor(eventEmitter: EventEmitter) {
    this.eventEmitter = eventEmitter;
  }
  
  /**
   * Connect directly to OpenAI's Realtime API
   */
  async connect(instructions = "You are a helpful AI assistant.", voice = "alloy"): Promise<void> {
    try {
      console.log("[DirectConnectionManager] Requesting token from token service");
      
      // Request an ephemeral token from our token service
      const tokenResponse = await fetch("/api/generate-realtime-token", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ 
          voice,
          instructions
        }),
      });
      
      if (!tokenResponse.ok) {
        const errorText = await tokenResponse.text();
        throw new Error(`Token service error: ${errorText}`);
      }
      
      const tokenData = await tokenResponse.json();
      
      if (!tokenData.client_secret?.value) {
        throw new Error("No token received from token service");
      }
      
      const ephemeralToken = tokenData.client_secret.value;
      console.log("[DirectConnectionManager] Received ephemeral token");
      
      // Connect to OpenAI using the ephemeral token
      console.log("[DirectConnectionManager] Connecting to OpenAI Realtime API");
      
      // Signal connection is in progress
      this.dispatchConnectionEvent('connecting');
      
      // Connect to OpenAI's WebSocket endpoint
      this.websocket = new WebSocket("wss://api.openai.com/v1/realtime/streams");
      
      // Set up connection handler
      this.websocket.onopen = () => {
        console.log("[DirectConnectionManager] WebSocket connection opened");
        
        // Authenticate using the ephemeral token
        this.send({
          type: "auth",
          authorization: `Bearer ${ephemeralToken}`
        });
        
        // Start heartbeat
        this.startHeartbeat();
      };
      
      // Set up message handler
      this.websocket.onmessage = (event) => {
        this.handleWebSocketMessage(event);
      };
      
      // Set up error handler
      this.websocket.onerror = (event) => {
        console.error("[DirectConnectionManager] WebSocket error:", event);
        this.dispatchConnectionEvent('failed', new Error("WebSocket connection error"));
      };
      
      // Set up close handler
      this.websocket.onclose = (event) => {
        console.log("[DirectConnectionManager] WebSocket closed:", event.code, event.reason);
        this.isConnected = false;
        this.stopHeartbeat();
        this.dispatchConnectionEvent('disconnected');
      };
      
      // Initialize audio context for processing audio data
      this.initializeAudioContext();
      
      // Return a promise that resolves when authentication is successful
      return new Promise((resolve, reject) => {
        // Set timeout for connection
        const timeout = setTimeout(() => {
          reject(new Error("Connection timeout"));
          this.dispatchConnectionEvent('failed', new Error("Connection timeout"));
        }, 10000);
        
        // Handle successful authentication
        const authHandler = (event: MessageEvent) => {
          try {
            const data = JSON.parse(event.data);
            
            if (data.type === "session.created") {
              console.log("[DirectConnectionManager] Session created successfully");
              
              // Remove event listener and clear timeout
              this.websocket!.removeEventListener("message", authHandler);
              clearTimeout(timeout);
              
              // Update connection state
              this.isConnected = true;
              this.dispatchConnectionEvent('connected');
              
              // Configure session
              this.configureSession();
              
              resolve();
            } else if (data.type === "error") {
              console.error("[DirectConnectionManager] Authentication error:", data.error);
              this.websocket!.removeEventListener("message", authHandler);
              clearTimeout(timeout);
              reject(new Error(data.error || "Authentication error"));
              this.dispatchConnectionEvent('failed', new Error(data.error || "Authentication error"));
            }
          } catch (error) {
            console.error("[DirectConnectionManager] Error processing message:", error);
          }
        };
        
        // Add temporary message handler for authentication
        this.websocket!.addEventListener("message", authHandler);
      });
      
    } catch (error) {
      console.error("[DirectConnectionManager] Connection error:", error);
      this.dispatchConnectionEvent('failed', error instanceof Error ? error : new Error(String(error)));
      throw error;
    }
  }
  
  /**
   * Configure session settings
   */
  private configureSession(): void {
    if (!this.websocket || this.websocket.readyState !== WebSocket.OPEN) return;
    
    // Session configuration to send after session.created event
    const sessionConfig = {
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
        "temperature": 0.8,
        "max_response_output_tokens": "inf"
      }   
    };
    
    console.log("[DirectConnectionManager] Configuring session");
    this.send(sessionConfig);
  }
  
  /**
   * Initialize audio context for processing audio
   */
  private initializeAudioContext(): void {
    try {
      this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)({
        sampleRate: 24000
      });
      console.log("[DirectConnectionManager] Audio context initialized");
    } catch (error) {
      console.error("[DirectConnectionManager] Failed to initialize audio context:", error);
    }
  }
  
  /**
   * Handle incoming WebSocket messages
   */
  private handleWebSocketMessage(event: MessageEvent): void {
    try {
      // Try to parse as JSON
      const data = JSON.parse(event.data);
      
      // Handle audio data
      if (data.type === "response.audio.delta") {
        const audioData = this.decodeAudioData(data.delta);
        if (audioData) {
          this.queueAudio(audioData);
          this.dispatchAudioEvent(audioData);
        }
        return;
      }
      
      // Handle transcript data
      if (data.type === "response.audio_transcript.delta") {
        this.dispatchTranscriptEvent(data.delta);
        return;
      }
      
      // Handle pong responses
      if (data.type === "pong") {
        this.lastPingTime = Date.now();
        return;
      }
      
      console.log("[DirectConnectionManager] Received message:", data.type || "unknown type");
      
    } catch (error) {
      // Not JSON or error processing
      console.error("[DirectConnectionManager] Error processing message:", error);
    }
  }
  
  /**
   * Decode base64 audio data into Float32Array
   */
  private decodeAudioData(base64Data: string): Float32Array | null {
    try {
      // Decode base64
      const binaryString = atob(base64Data);
      const len = binaryString.length;
      const bytes = new Uint8Array(len);
      
      for (let i = 0; i < len; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }
      
      // Convert to Int16Array (correct byte order for PCM16)
      const int16Data = new Int16Array(bytes.buffer);
      
      // Convert to normalized Float32Array
      const floatData = new Float32Array(int16Data.length);
      for (let i = 0; i < int16Data.length; i++) {
        // Convert Int16 to normalized Float32 (-1.0 to 1.0)
        floatData[i] = int16Data[i] / 32768.0;
      }
      
      return floatData;
    } catch (error) {
      console.error("[DirectConnectionManager] Error decoding audio data:", error);
      return null;
    }
  }
  
  /**
   * Queue audio data for sequential playback
   */
  private queueAudio(audioData: Float32Array): void {
    this.audioQueue.push(audioData);
    
    // Start processing queue if not already processing
    if (!this.isProcessingAudio) {
      this.processAudioQueue();
    }
  }
  
  /**
   * Process audio queue sequentially
   */
  private async processAudioQueue(): Promise<void> {
    if (this.audioQueue.length === 0 || !this.audioContext) {
      this.isProcessingAudio = false;
      return;
    }
    
    this.isProcessingAudio = true;
    
    try {
      // Get next audio chunk
      const audioData = this.audioQueue.shift()!;
      
      // Create buffer
      const buffer = this.audioContext.createBuffer(1, audioData.length, 24000);
      const channel = buffer.getChannelData(0);
      channel.set(audioData);
      
      // Create source and play
      const source = this.audioContext.createBufferSource();
      source.buffer = buffer;
      source.connect(this.audioContext.destination);
      
      // When finished, process next chunk
      source.onended = () => {
        this.processAudioQueue();
      };
      
      source.start();
      
    } catch (error) {
      console.error("[DirectConnectionManager] Error processing audio:", error);
      // Continue with next chunk even if current fails
      this.processAudioQueue();
    }
  }
  
  /**
   * Start heartbeat mechanism
   */
  private startHeartbeat(): void {
    this.lastPingTime = Date.now();
    
    this.pingInterval = window.setInterval(() => {
      if (this.websocket?.readyState === WebSocket.OPEN) {
        // Send ping
        this.send({ 
          type: "ping",
          timestamp: new Date().toISOString()
        });
        
        // Check if we got responses to previous pings
        const now = Date.now();
        if (now - this.lastPingTime > 30000) {
          console.warn("[DirectConnectionManager] No pong received for 30 seconds, reconnecting");
          this.disconnect();
          this.dispatchConnectionEvent('disconnected');
        }
      } else {
        // Connection is closed or closing
        this.stopHeartbeat();
      }
    }, 15000);
  }
  
  /**
   * Stop heartbeat mechanism
   */
  private stopHeartbeat(): void {
    if (this.pingInterval !== null) {
      clearInterval(this.pingInterval);
      this.pingInterval = null;
    }
  }
  
  /**
   * Send data through WebSocket
   */
  send(data: any): boolean {
    if (!this.websocket || this.websocket.readyState !== WebSocket.OPEN) {
      console.warn("[DirectConnectionManager] Cannot send message - WebSocket not connected");
      return false;
    }
    
    try {
      this.websocket.send(JSON.stringify(data));
      return true;
    } catch (error) {
      console.error("[DirectConnectionManager] Error sending message:", error);
      return false;
    }
  }
  
  /**
   * Send a text message
   */
  sendTextMessage(text: string): boolean {
    if (!this.isConnected) return false;
    
    // Create message event
    const event = {
      type: "conversation.item.create",
      item: {
        type: "message",
        role: "user",
        content: [
          {
            type: "input_text",
            text: text
          }
        ]
      }
    };
    
    // Send message
    const sentMessage = this.send(event);
    
    if (sentMessage) {
      // Request response from the model
      this.send({type: "response.create"});
    }
    
    return sentMessage;
  }
  
  /**
   * Send audio data
   */
  sendAudioData(audioData: Float32Array): boolean {
    if (!this.isConnected) return false;
    
    // Convert Float32Array to base64 string
    const encodedData = this.encodeAudioData(audioData);
    
    // Send audio data
    return this.send({
      type: 'input_audio_buffer.append',
      audio: encodedData
    });
  }
  
  /**
   * Encode audio data to base64
   */
  private encodeAudioData(float32Array: Float32Array): string {
    // Convert Float32Array to Int16Array
    const int16Array = new Int16Array(float32Array.length);
    for (let i = 0; i < float32Array.length; i++) {
      const s = Math.max(-1, Math.min(1, float32Array[i]));
      int16Array[i] = s < 0 ? s * 0x8000 : s * 0x7FFF;
    }
    
    // Convert Int16Array to Uint8Array
    const uint8Array = new Uint8Array(int16Array.buffer);
    
    // Convert Uint8Array to binary string
    let binary = '';
    const chunkSize = 0x8000; // Split in chunks to avoid call stack size exceeded
    
    for (let i = 0; i < uint8Array.length; i += chunkSize) {
      const chunk = uint8Array.subarray(i, Math.min(i + chunkSize, uint8Array.length));
      binary += String.fromCharCode.apply(null, Array.from(chunk));
    }
    
    // Convert binary string to base64
    return btoa(binary);
  }
  
  /**
   * Dispatch connection event
   */
  private dispatchConnectionEvent(
    state: 'connecting' | 'connected' | 'disconnected' | 'failed',
    error?: Error
  ): void {
    const event: RealtimeEvent = {
      type: 'connection',
      state,
      error
    };
    
    this.eventEmitter.dispatchEvent('event', event);
  }
  
  /**
   * Dispatch audio event
   */
  private dispatchAudioEvent(data: Float32Array): void {
    const event: RealtimeEvent = {
      type: 'audio',
      data
    };
    
    this.eventEmitter.dispatchEvent('event', event);
  }
  
  /**
   * Dispatch transcript event
   */
  private dispatchTranscriptEvent(text: string): void {
    const event: RealtimeEvent = {
      type: 'transcript',
      text
    };
    
    this.eventEmitter.dispatchEvent('event', event);
  }
  
  /**
   * Check if connected
   */
  isConnectedToOpenAI(): boolean {
    return this.isConnected;
  }
  
  /**
   * Disconnect from OpenAI
   */
  disconnect(): void {
    this.stopHeartbeat();
    
    // Close audio context
    if (this.audioContext?.state !== 'closed') {
      this.audioContext?.close();
    }
    
    // Close WebSocket
    if (this.websocket && this.websocket.readyState !== WebSocket.CLOSED) {
      try {
        this.websocket.close();
      } catch (error) {
        console.error("[DirectConnectionManager] Error closing WebSocket:", error);
      }
    }
    
    this.websocket = null;
    this.isConnected = false;
  }
}
