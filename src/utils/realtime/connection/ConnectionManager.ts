import { EventEmitter } from '../EventEmitter';
import { WebRTCManager } from './WebRTCManager';
import { TokenService } from '../api/TokenService';
import { RealtimeEvent } from '../types/events';

/**
 * Manages the overall connection lifecycle
 */
export class ConnectionManager {
  private webrtcManager: WebRTCManager;
  private eventEmitter: EventEmitter;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 3;
  private tokenExpiryTimeout: number | null = null;
  private pingInterval: number | null = null;
  private isConnected = false;
  private tokenResponse: any = null;
  
  constructor(eventEmitter: EventEmitter) {
    this.eventEmitter = eventEmitter;
    this.webrtcManager = new WebRTCManager(eventEmitter);
    
    // Setup internal event listeners
    this.eventEmitter.addEventListener('webrtc-event', this.handleOpenAIEvent.bind(this));
    this.eventEmitter.addEventListener('data-channel-open', this.handleDataChannelOpen.bind(this));
  }
  
  /**
   * Connect to OpenAI
   */
  async connect(instructions: string, voice: string): Promise<void> {
    try {
      // Dispatch connecting state
      this.dispatchConnectionState('connecting');
      
      // Get token from service
      this.tokenResponse = await TokenService.requestToken(instructions, voice);
      const ephemeralKey = this.tokenResponse.client_secret.value;
      
      // Set up token expiry handling
      this.setupTokenExpiryHandler(instructions, voice);
      
      // Initialize WebRTC connection
      await this.webrtcManager.initializeConnection(ephemeralKey);
      
      // Start keepalive ping
      this.startPing();
      
      // Update connection state
      this.isConnected = true;
      this.reconnectAttempts = 0;
      
      // Dispatch connected state
      this.dispatchConnectionState('connected');
      
    } catch (error) {
      console.error("[ConnectionManager] Connection failed:", error);
      
      // Dispatch failed state
      this.dispatchConnectionState('failed', error instanceof Error ? error : new Error(String(error)));
      
      // Attempt reconnect
      this.handleReconnect(instructions, voice);
      
      throw error;
    }
  }
  
  /**
   * Disconnect from OpenAI
   */
  disconnect(): void {
    console.log("[ConnectionManager] Disconnecting");
    
    // Clear intervals and timeouts
    this.clearTimers();
    
    // Close WebRTC connection
    this.webrtcManager.close();
    
    // Update connection state
    this.isConnected = false;
    
    // Dispatch disconnected state
    this.dispatchConnectionState('disconnected');
  }
  
  /**
   * Send session update
   */
  sendSessionUpdate(): void {
    console.log("[ConnectionManager] Sending session update");
    
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
    
    this.webrtcManager.sendMessage(sessionUpdate);
  }
  
  /**
   * Send text message
   */
  sendTextMessage(text: string): boolean {
    if (!this.isConnected || !this.webrtcManager.isConnected()) {
      return false;
    }
    
    try {
      console.log("[ConnectionManager] Sending text message:", text);
      
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
      
      if (!this.webrtcManager.sendMessage(messageEvent)) {
        return false;
      }
      
      // Request response
      return this.webrtcManager.sendMessage({type: 'response.create'});
      
    } catch (error) {
      console.error("[ConnectionManager] Error sending text message:", error);
      return false;
    }
  }
  
  /**
   * Send audio data
   */
  sendAudioData(audioData: Float32Array): boolean {
    if (!this.isConnected || !this.webrtcManager.isConnected()) {
      return false;
    }
    
    try {
      const audioEvent = {
        type: 'input_audio_buffer.append',
        audio: this.encodeAudioData(audioData)
      };
      
      return this.webrtcManager.sendMessage(audioEvent);
    } catch (error) {
      console.error("[ConnectionManager] Error sending audio data:", error);
      return false;
    }
  }
  
  /**
   * Check connection status
   */
  isConnectedToOpenAI(): boolean {
    return this.isConnected && this.webrtcManager.isConnected();
  }
  
  /**
   * Handle OpenAI events
   */
  private handleOpenAIEvent(event: any): void {
    // Handle ping events
    if (event.type === 'ping') {
      this.sendPong();
      return;
    }
    
    // Handle session events
    if (event.type === 'session.created') {
      console.log("[ConnectionManager] Session created:", event.session_id);
      return;
    }
    
    // Handle speech events
    if (event.type === 'response.audio.delta') {
      this.handleAudioDelta(event.delta);
      return;
    }
    
    // Handle transcript events
    if (event.type === 'response.audio_transcript.delta') {
      this.handleTranscriptDelta(event.delta);
      return;
    }
    
    // Log other events
    console.log("[ConnectionManager] Received event:", event.type);
  }
  
  /**
   * Handle data channel open
   */
  private handleDataChannelOpen(): void {
    this.sendSessionUpdate();
  }
  
  /**
   * Handle audio delta
   */
  private handleAudioDelta(base64Audio: string): void {
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
      console.error("[ConnectionManager] Error processing audio data:", error);
    }
  }
  
  /**
   * Handle transcript delta
   */
  private transcript = '';
  
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
   * Setup token expiry handler
   */
  private setupTokenExpiryHandler(instructions: string, voice: string): void {
    if (!this.tokenResponse) return;
    
    // Set token expiry handler
    const tokenExpiryDate = new Date(this.tokenResponse.client_secret.expires_at);
    const timeUntilExpiry = tokenExpiryDate.getTime() - Date.now();
    
    // Clear any existing timeout
    if (this.tokenExpiryTimeout) {
      clearTimeout(this.tokenExpiryTimeout);
    }
    
    // Set new timeout to reconnect shortly before token expires
    this.tokenExpiryTimeout = setTimeout(() => {
      console.log("[ConnectionManager] Token expiring soon, reconnecting");
      this.reconnect(instructions, voice);
    }, timeUntilExpiry - 30000) as unknown as number; // Reconnect 30 seconds before expiry
  }
  
  /**
   * Start ping interval
   */
  private startPing(): void {
    // Clear any existing interval
    if (this.pingInterval) {
      clearInterval(this.pingInterval);
      this.pingInterval = null;
    }
    
    // Send ping every 30 seconds
    this.pingInterval = setInterval(() => {
      this.webrtcManager.sendMessage({
        type: 'ping',
        timestamp: Date.now()
      });
    }, 30000) as unknown as number;
  }
  
  /**
   * Send pong response
   */
  private sendPong(): void {
    this.webrtcManager.sendMessage({
      type: 'pong',
      timestamp: Date.now()
    });
  }
  
  /**
   * Dispatch connection state
   */
  private dispatchConnectionState(state: 'connecting' | 'connected' | 'disconnected' | 'failed', error?: Error): void {
    this.dispatchEvent({
      type: 'connection',
      state,
      error
    });
  }
  
  /**
   * Reconnect to OpenAI
   */
  private async reconnect(instructions = "You are a helpful AI assistant.", voice = "alloy"): Promise<void> {
    // Disconnect first
    this.disconnect();
    
    try {
      // Connect again
      await this.connect(instructions, voice);
    } catch (error) {
      console.error("[ConnectionManager] Reconnection failed:", error);
      
      // Handle reconnect attempt
      this.handleReconnect(instructions, voice);
    }
  }
  
  /**
   * Handle reconnection attempt
   */
  private handleReconnect(instructions = "You are a helpful AI assistant.", voice = "alloy"): void {
    this.reconnectAttempts++;
    
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      const delay = Math.pow(2, this.reconnectAttempts) * 1000; // Exponential backoff
      
      console.log(`[ConnectionManager] Will attempt reconnect in ${delay/1000} seconds (attempt ${this.reconnectAttempts})`);
      
      // Schedule reconnect
      setTimeout(() => {
        this.reconnect(instructions, voice);
      }, delay);
    } else {
      console.error(`[ConnectionManager] Failed to reconnect after ${this.maxReconnectAttempts} attempts`);
      
      // Dispatch disconnected event
      this.dispatchConnectionState('disconnected');
    }
  }
  
  /**
   * Clear all timers
   */
  private clearTimers(): void {
    if (this.pingInterval) {
      clearInterval(this.pingInterval);
      this.pingInterval = null;
    }
    
    if (this.tokenExpiryTimeout) {
      clearTimeout(this.tokenExpiryTimeout);
      this.tokenExpiryTimeout = null;
    }
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
   * Dispatch event
   */
  private dispatchEvent(event: RealtimeEvent): void {
    this.eventEmitter.dispatchEvent('event', event);
  }
}
