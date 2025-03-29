
// Update the RealtimeAudio.ts file to include better audio handling

type TranscriptCallback = (text: string) => void;

export class RealtimeChat {
  private websocket: WebSocket | null = null;
  private transcriptCallback: TranscriptCallback;
  private eventListeners: Map<string, Function[]> = new Map();
  isConnected: boolean = false;
  private lastTranscriptUpdate: number = 0;
  private processingTimeout: NodeJS.Timeout | null = null;
  private audioContext: AudioContext | null = null;
  private audioQueue: AudioChunk[] = [];
  private isPlayingAudio: boolean = false;

  constructor(transcriptCallback: TranscriptCallback) {
    this.transcriptCallback = transcriptCallback;
  }

  // Connect to the realtime chat service
  async connect(): Promise<void> {
    try {
      console.log("Connecting to voice service...");
      
      // Initialize AudioContext for playback
      this.audioContext = new AudioContext({ sampleRate: 24000 });
      
      // Get project ID from the URL
      const projectId = 'oseowhythgbqvllwonaz'; // Your Supabase project ID
      
      // Connect to Supabase Edge Function WebSocket
      const wsUrl = `wss://${projectId}.functions.supabase.co/realtime-chat`;
      console.log("Connecting to WebSocket:", wsUrl);
      
      this.websocket = new WebSocket(wsUrl);
      
      return new Promise((resolve, reject) => {
        if (!this.websocket) {
          reject(new Error("Failed to create WebSocket"));
          return;
        }
        
        this.websocket.onopen = () => {
          console.log("WebSocket connection established");
          this.isConnected = true;
          this.setupWebSocketHandlers();
          resolve();
        };
        
        this.websocket.onerror = (error) => {
          console.error("WebSocket connection error:", error);
          this.isConnected = false;
          reject(error);
        };
        
        this.websocket.onclose = (event) => {
          console.log("WebSocket connection closed:", event.code, event.reason);
          this.isConnected = false;
        };
      });
    } catch (error) {
      console.error("Failed to connect:", error);
      this.isConnected = false;
      throw error;
    }
  }
  
  // Setup WebSocket event handlers
  private setupWebSocketHandlers() {
    if (!this.websocket) return;
    
    this.websocket.onmessage = async (event) => {
      try {
        const data = JSON.parse(event.data);
        console.log("Received WebSocket message:", data.type);
        
        switch (data.type) {
          case 'session.created':
            console.log("Session created successfully");
            // Configure session after creation
            this.configureSession();
            break;
            
          case 'response.audio.delta':
            await this.handleAudioDelta(data.delta);
            break;
            
          case 'response.audio_transcript.delta':
            this.updateTranscript(data.delta);
            break;
            
          case 'response.audio.done':
            console.log("Audio response complete");
            this.dispatchEvent('response', this.transcriptCallback.toString());
            break;
            
          case 'error':
            console.error("Error from voice service:", data.error);
            break;
            
          default:
            console.log("Received message type:", data.type);
        }
      } catch (error) {
        console.error("Error processing WebSocket message:", error);
      }
    };
  }
  
  // Configure session settings after connection
  private configureSession() {
    if (!this.websocket || !this.isConnected) return;
    
    const sessionConfig = {
      "event_id": "config_event",
      "type": "session.update",
      "session": {
        "modalities": ["text", "audio"],
        "instructions": "You are a helpful voice assistant that speaks naturally with users. Keep responses concise and conversational.",
        "voice": "alloy",
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
        "max_response_output_tokens": 150
      }
    };
    
    console.log("Configuring session...");
    this.websocket.send(JSON.stringify(sessionConfig));
  }
  
  // For handling audio data chunks
  private async handleAudioDelta(base64Audio: string) {
    if (!this.audioContext) return;
    
    // Convert base64 to ArrayBuffer
    const binaryString = atob(base64Audio);
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }
    
    // Create audio data for PCM16
    const audioData = this.createAudioFromPCM16(bytes);
    
    // Play audio
    await this.queueAudioForPlayback(audioData);
  }
  
  // Create audio data from PCM16 format
  private createAudioFromPCM16(pcmData: Uint8Array): AudioBuffer {
    if (!this.audioContext) {
      throw new Error("AudioContext not initialized");
    }
    
    // Convert bytes to samples
    const samples = pcmData.length / 2;
    const audioBuffer = this.audioContext.createBuffer(1, samples, 24000);
    const channelData = audioBuffer.getChannelData(0);
    
    // PCM16 is signed 16-bit little-endian
    for (let i = 0; i < samples; i++) {
      const idx = i * 2;
      const sample = (pcmData[idx] | (pcmData[idx + 1] << 8)) / 32768.0;
      channelData[i] = sample;
    }
    
    return audioBuffer;
  }
  
  // Interface for audio chunks in the queue
  interface AudioChunk {
    buffer: AudioBuffer;
  }
  
  // Queue audio for sequential playback
  private async queueAudioForPlayback(audioBuffer: AudioBuffer): Promise<void> {
    this.audioQueue.push({ buffer: audioBuffer });
    
    if (!this.isPlayingAudio) {
      this.playNextAudioChunk();
    }
  }
  
  // Play the next chunk in the queue
  private playNextAudioChunk() {
    if (this.audioQueue.length === 0) {
      this.isPlayingAudio = false;
      return;
    }
    
    this.isPlayingAudio = true;
    const chunk = this.audioQueue.shift();
    
    if (chunk && this.audioContext) {
      const source = this.audioContext.createBufferSource();
      source.buffer = chunk.buffer;
      source.connect(this.audioContext.destination);
      
      source.onended = () => {
        this.playNextAudioChunk();
      };
      
      source.start(0);
    }
  }
  
  // Send a message to the AI
  sendMessage(message: string): void {
    if (!this.isConnected || !this.websocket) {
      console.error("WebSocket not connected");
      return;
    }
    
    console.log("Sending message to voice service:", message);
    
    // Clear any processing timeout
    if (this.processingTimeout) {
      clearTimeout(this.processingTimeout);
    }
    
    // Create a conversation item with user message
    const messageEvent = {
      type: 'conversation.item.create',
      item: {
        type: 'message',
        role: 'user',
        content: [
          {
            type: 'input_text',
            text: message
          }
        ]
      }
    };
    
    // Send the message
    this.websocket.send(JSON.stringify(messageEvent));
    
    // Request a response
    this.websocket.send(JSON.stringify({type: 'response.create'}));
  }
  
  // Send speech data to the AI
  sendSpeechData(audioData: Float32Array): void {
    if (!this.isConnected || !this.websocket) return;
    
    // Convert Float32Array to base64 encoded Int16Array
    const base64Audio = this.encodeAudioData(audioData);
    
    // Send audio buffer
    const audioEvent = {
      type: 'input_audio_buffer.append',
      audio: base64Audio
    };
    
    this.websocket.send(JSON.stringify(audioEvent));
  }
  
  // Encode audio data for API
  private encodeAudioData(float32Array: Float32Array): string {
    // Convert to Int16Array (PCM 16-bit format)
    const int16Array = new Int16Array(float32Array.length);
    for (let i = 0; i < float32Array.length; i++) {
      const s = Math.max(-1, Math.min(1, float32Array[i]));
      int16Array[i] = s < 0 ? s * 0x8000 : s * 0x7FFF;
    }
    
    // Convert to binary string
    const uint8Array = new Uint8Array(int16Array.buffer);
    let binary = '';
    const chunkSize = 0x8000;
    
    for (let i = 0; i < uint8Array.length; i += chunkSize) {
      const chunk = uint8Array.subarray(i, Math.min(i + chunkSize, uint8Array.length));
      binary += String.fromCharCode.apply(null, Array.from(chunk));
    }
    
    // Return as base64
    return btoa(binary);
  }
  
  // Update transcript with new text
  updateTranscript(text: string): void {
    this.lastTranscriptUpdate = Date.now();
    this.transcriptCallback(text);
  }
  
  // Disconnect from the realtime chat service
  disconnect(): void {
    console.log("Disconnecting from voice service");
    
    if (this.processingTimeout) {
      clearTimeout(this.processingTimeout);
      this.processingTimeout = null;
    }
    
    if (this.websocket) {
      this.websocket.close();
      this.websocket = null;
    }
    
    if (this.audioContext) {
      this.audioContext.close();
      this.audioContext = null;
    }
    
    this.isConnected = false;
    this.audioQueue = [];
    this.isPlayingAudio = false;
  }

  // Event listener system
  addEventListener(eventName: string, callback: Function): void {
    if (!this.eventListeners.has(eventName)) {
      this.eventListeners.set(eventName, []);
    }
    this.eventListeners.get(eventName)?.push(callback);
  }

  removeEventListener(eventName: string, callback: Function): void {
    const listeners = this.eventListeners.get(eventName);
    if (!listeners) return;
    
    const index = listeners.indexOf(callback);
    if (index !== -1) {
      listeners.splice(index, 1);
    }
  }

  private dispatchEvent(eventName: string, data: any): void {
    const listeners = this.eventListeners.get(eventName);
    if (!listeners) return;
    
    for (const callback of listeners) {
      callback(data);
    }
  }
}
