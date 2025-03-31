
import { EventEmitter } from './EventEmitter';
import { DirectConnectionManager } from './connection/DirectConnectionManager';

export type RealtimeEvent = {
  type: 'connection' | 'transcript' | 'audio' | 'error';
  state?: 'connecting' | 'connected' | 'disconnected' | 'failed';
  text?: string;
  data?: Float32Array;
  error?: Error;
};

/**
 * Class for direct connection to OpenAI's Realtime API using WebRTC
 */
export class DirectOpenAIConnection {
  private pc: RTCPeerConnection | null = null;
  private dc: RTCDataChannel | null = null;
  private audioEl: HTMLAudioElement;
  private isConnected: boolean = false;
  private eventEmitter = new EventEmitter();
  private connectionManager = new DirectConnectionManager();
  private testMode: boolean = false;
  
  /**
   * Initialize the connection
   * @param options Configuration options
   */
  constructor(options: { testMode?: boolean } = {}) {
    this.testMode = options.testMode || false;
    this.audioEl = document.createElement('audio');
    this.audioEl.autoplay = true;
    
    // This is necessary for Safari
    document.body.appendChild(this.audioEl);
    this.audioEl.style.display = 'none';
  }
  
  /**
   * Add an event listener for connection events
   */
  addEventListener(listener: (event: RealtimeEvent) => void): () => void {
    return this.eventEmitter.subscribe((event: RealtimeEvent) => {
      listener(event);
    });
  }
  
  /**
   * Connect to OpenAI's Realtime API
   */
  async connect(instructions: string = "You are a helpful, friendly assistant.", voice: string = "alloy"): Promise<void> {
    try {
      this.eventEmitter.emit({
        type: 'connection',
        state: 'connecting'
      });
      
      console.log("[DirectOpenAI] Initiating connection");
      
      if (this.testMode) {
        console.log("[DirectOpenAI] Test mode enabled, simulating successful connection");
        
        // Simulate successful connection after a short delay
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        this.isConnected = true;
        this.eventEmitter.emit({
          type: 'connection',
          state: 'connected'
        });
        
        return;
      }
      
      // Get ephemeral token directly using the DirectConnectionManager
      const { clientSecret } = await this.connectionManager.connect(instructions, voice);
      
      if (!clientSecret) {
        throw new Error("Failed to obtain authorization token");
      }
      
      // Create WebRTC Peer Connection
      this.pc = new RTCPeerConnection();
      
      // Set up remote audio
      this.pc.ontrack = (event) => {
        console.log("[DirectOpenAI] Received audio track");
        if (event.streams && event.streams[0]) {
          this.audioEl.srcObject = event.streams[0];
        }
      };
      
      // Add local audio track (microphone)
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          audio: {
            echoCancellation: true,
            noiseSuppression: true,
            autoGainControl: true,
            sampleRate: 24000,
            channelCount: 1
          }
        });
        
        console.log("[DirectOpenAI] Adding local audio track");
        const audioTrack = stream.getAudioTracks()[0];
        this.pc.addTrack(audioTrack, stream);
      } catch (micError) {
        console.error("[DirectOpenAI] Microphone access error:", micError);
        throw new Error("Could not access microphone. Please ensure microphone permissions are granted.");
      }
      
      // Set up data channel for messages
      this.dc = this.pc.createDataChannel("oai-events");
      this.dc.onmessage = this.handleDataChannelMessage.bind(this);
      this.dc.onopen = () => {
        console.log("[DirectOpenAI] Data channel opened");
      };
      this.dc.onerror = (error) => {
        console.error("[DirectOpenAI] Data channel error:", error);
        this.eventEmitter.emit({
          type: 'error',
          error: new Error("Data channel error")
        });
      };
      
      // Create offer
      const offer = await this.pc.createOffer();
      await this.pc.setLocalDescription(offer);
      
      if (!this.pc.localDescription?.sdp) {
        throw new Error("Failed to create local description");
      }
      
      // Exchange SDP with OpenAI server
      console.log("[DirectOpenAI] Sending SDP offer");
      
      const sdpResponse = await fetch("https://api.openai.com/v1/realtime?model=gpt-4o-realtime-preview-2024-10-01", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${clientSecret}`,
          "Content-Type": "application/sdp"
        },
        body: this.pc.localDescription.sdp
      });
      
      if (!sdpResponse.ok) {
        const errorText = await sdpResponse.text();
        console.error("[DirectOpenAI] SDP exchange error:", errorText);
        throw new Error(`OpenAI API error: ${sdpResponse.status}`);
      }
      
      // Set remote description from OpenAI
      const sdpAnswer = await sdpResponse.text();
      const remoteDesc = new RTCSessionDescription({
        type: 'answer',
        sdp: sdpAnswer
      });
      
      await this.pc.setRemoteDescription(remoteDesc);
      console.log("[DirectOpenAI] Connection established");
      
      this.isConnected = true;
      this.eventEmitter.emit({
        type: 'connection',
        state: 'connected'
      });
      
    } catch (error) {
      console.error("[DirectOpenAI] Connection failed:", error);
      
      // Cleanup failed connection
      this.disconnect();
      
      // Emit error event
      this.eventEmitter.emit({
        type: 'connection',
        state: 'failed',
        error: error instanceof Error ? error : new Error(String(error))
      });
      
      throw error;
    }
  }
  
  /**
   * Disconnect from OpenAI
   */
  disconnect(): void {
    console.log("[DirectOpenAI] Disconnecting");
    
    if (this.dc) {
      this.dc.close();
      this.dc = null;
    }
    
    if (this.pc) {
      this.pc.close();
      this.pc = null;
    }
    
    // Close audio element
    if (this.audioEl) {
      this.audioEl.srcObject = null;
      if (document.body.contains(this.audioEl)) {
        document.body.removeChild(this.audioEl);
      }
    }
    
    this.isConnected = false;
    this.connectionManager.disconnect();
    
    this.eventEmitter.emit({
      type: 'connection',
      state: 'disconnected'
    });
  }
  
  /**
   * Handle messages from data channel
   */
  private handleDataChannelMessage(event: MessageEvent): void {
    try {
      const message = JSON.parse(event.data);
      console.log("[DirectOpenAI] Received message:", message.type);
      
      // Handle different message types
      if (message.type === 'response.audio_transcript.delta') {
        // Process transcript
        this.eventEmitter.emit({
          type: 'transcript',
          text: message.delta || ''
        });
      } else if (message.type === 'response.audio.delta') {
        // Process audio
        const binary = atob(message.delta);
        const bytes = new Uint8Array(binary.length);
        for (let i = 0; i < binary.length; i++) {
          bytes[i] = binary.charCodeAt(i);
        }
        
        // Convert to float32 audio
        const int16Array = new Int16Array(bytes.buffer);
        const float32Array = new Float32Array(int16Array.length);
        for (let i = 0; i < int16Array.length; i++) {
          float32Array[i] = int16Array[i] / 32768.0;
        }
        
        // Emit audio event
        this.eventEmitter.emit({
          type: 'audio',
          data: float32Array
        });
      }
    } catch (error) {
      console.error("[DirectOpenAI] Error processing message:", error);
    }
  }
  
  /**
   * Send a text message to OpenAI
   */
  sendTextMessage(text: string): boolean {
    if (!this.isConnectedToOpenAI()) {
      console.error("[DirectOpenAI] Cannot send message: not connected");
      return false;
    }
    
    try {
      const event = {
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
      
      this.dc?.send(JSON.stringify(event));
      this.dc?.send(JSON.stringify({type: 'response.create'}));
      return true;
    } catch (error) {
      console.error("[DirectOpenAI] Error sending text message:", error);
      return false;
    }
  }
  
  /**
   * Send audio data to OpenAI
   */
  sendAudioData(audioData: Float32Array): boolean {
    if (!this.isConnectedToOpenAI()) {
      console.error("[DirectOpenAI] Cannot send audio: not connected");
      return false;
    }
    
    try {
      // Convert to int16 (16-bit PCM)
      const int16Array = new Int16Array(audioData.length);
      for (let i = 0; i < audioData.length; i++) {
        const s = Math.max(-1, Math.min(1, audioData[i]));
        int16Array[i] = s < 0 ? s * 0x8000 : s * 0x7FFF;
      }
      
      // Convert to base64
      const uint8Array = new Uint8Array(int16Array.buffer);
      let binary = '';
      const chunkSize = 0x8000;
      
      for (let i = 0; i < uint8Array.length; i += chunkSize) {
        const chunk = uint8Array.subarray(i, Math.min(i + chunkSize, uint8Array.length));
        binary += String.fromCharCode.apply(null, Array.from(chunk));
      }
      
      const base64 = btoa(binary);
      
      // Send to OpenAI
      const event = {
        type: 'input_audio_buffer.append',
        audio: base64
      };
      
      this.dc?.send(JSON.stringify(event));
      return true;
    } catch (error) {
      console.error("[DirectOpenAI] Error sending audio data:", error);
      return false;
    }
  }
  
  /**
   * Check if connected to OpenAI
   */
  isConnectedToOpenAI(): boolean {
    if (this.testMode) {
      return this.isConnected;
    }
    return (
      this.isConnected && 
      this.pc !== null && 
      this.pc.connectionState === 'connected' &&
      this.dc !== null && 
      this.dc.readyState === 'open'
    );
  }
}
