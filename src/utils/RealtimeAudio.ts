
import { supabase } from "@/integrations/supabase/client";

export class AudioRecorder {
  private stream: MediaStream | null = null;
  private audioContext: AudioContext | null = null;
  private processor: ScriptProcessorNode | null = null;
  private source: MediaStreamAudioSourceNode | null = null;

  constructor(private onAudioData: (audioData: Float32Array) => void) {}

  async start() {
    try {
      this.stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          sampleRate: 24000,
          channelCount: 1,
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        }
      });
      
      this.audioContext = new AudioContext({
        sampleRate: 24000,
      });
      
      this.source = this.audioContext.createMediaStreamSource(this.stream);
      this.processor = this.audioContext.createScriptProcessor(4096, 1, 1);
      
      this.processor.onaudioprocess = (e) => {
        const inputData = e.inputBuffer.getChannelData(0);
        this.onAudioData(new Float32Array(inputData));
      };
      
      this.source.connect(this.processor);
      this.processor.connect(this.audioContext.destination);
    } catch (error) {
      console.error('Error accessing microphone:', error);
      throw error;
    }
  }

  stop() {
    if (this.source) {
      this.source.disconnect();
      this.source = null;
    }
    if (this.processor) {
      this.processor.disconnect();
      this.processor = null;
    }
    if (this.stream) {
      this.stream.getTracks().forEach(track => track.stop());
      this.stream = null;
    }
    if (this.audioContext) {
      this.audioContext.close();
      this.audioContext = null;
    }
  }
}

export const encodeAudioForAPI = (float32Array: Float32Array): string => {
  const int16Array = new Int16Array(float32Array.length);
  for (let i = 0; i < float32Array.length; i++) {
    const s = Math.max(-1, Math.min(1, float32Array[i]));
    int16Array[i] = s < 0 ? s * 0x8000 : s * 0x7FFF;
  }
  
  const uint8Array = new Uint8Array(int16Array.buffer);
  let binary = '';
  const chunkSize = 0x8000;
  
  for (let i = 0; i < uint8Array.length; i += chunkSize) {
    const chunk = uint8Array.subarray(i, Math.min(i + chunkSize, uint8Array.length));
    binary += String.fromCharCode.apply(null, Array.from(chunk));
  }
  
  return btoa(binary);
};

export class AudioQueue {
  private queue: Uint8Array[] = [];
  private isPlaying = false;
  private audioContext: AudioContext;

  constructor() {
    this.audioContext = new AudioContext({
      sampleRate: 24000,
    });
  }

  async addToQueue(audioData: Uint8Array) {
    this.queue.push(audioData);
    
    if (!this.isPlaying) {
      await this.playNext();
    }
  }

  private async playNext() {
    if (this.queue.length === 0) {
      this.isPlaying = false;
      return;
    }

    this.isPlaying = true;
    const audioData = this.queue.shift()!;

    try {
      // Create a buffer source and play it
      const audioBuffer = await this.decodeAudioData(audioData);
      
      const source = this.audioContext.createBufferSource();
      source.buffer = audioBuffer;
      source.connect(this.audioContext.destination);
      
      source.onended = () => this.playNext();
      source.start(0);
    } catch (error) {
      console.error('Error playing audio:', error);
      // Continue to next audio chunk even if current one fails
      this.playNext();
    }
  }

  private async decodeAudioData(pcmData: Uint8Array): Promise<AudioBuffer> {
    // Convert PCM data to WAV format for browser compatibility
    const wavData = this.createWavFromPCM(pcmData);
    
    return new Promise((resolve, reject) => {
      this.audioContext.decodeAudioData(
        wavData.buffer,
        (buffer) => resolve(buffer),
        (err) => reject(err)
      );
    });
  }

  private createWavFromPCM(pcmData: Uint8Array): Uint8Array {
    // Convert bytes to 16-bit samples
    const int16Data = new Int16Array(pcmData.length / 2);
    for (let i = 0; i < pcmData.length; i += 2) {
      int16Data[i / 2] = (pcmData[i] << 8) | pcmData[i + 1];
    }
    
    // Create WAV header
    const wavHeader = new ArrayBuffer(44);
    const view = new DataView(wavHeader);
    
    const writeString = (view: DataView, offset: number, string: string) => {
      for (let i = 0; i < string.length; i++) {
        view.setUint8(offset + i, string.charCodeAt(i));
      }
    };

    // WAV header parameters
    const sampleRate = 24000;
    const numChannels = 1;
    const bitsPerSample = 16;
    const blockAlign = (numChannels * bitsPerSample) / 8;
    const byteRate = sampleRate * blockAlign;
    const dataSize = int16Data.byteLength;

    // Write WAV header
    writeString(view, 0, 'RIFF');
    view.setUint32(4, 36 + dataSize, true);
    writeString(view, 8, 'WAVE');
    writeString(view, 12, 'fmt ');
    view.setUint32(16, 16, true);
    view.setUint16(20, 1, true); // PCM format
    view.setUint16(22, numChannels, true);
    view.setUint32(24, sampleRate, true);
    view.setUint32(28, byteRate, true);
    view.setUint16(32, blockAlign, true);
    view.setUint16(34, bitsPerSample, true);
    writeString(view, 36, 'data');
    view.setUint32(40, dataSize, true);
    
    // Combine header and data
    const wavArray = new Uint8Array(wavHeader.byteLength + int16Data.byteLength);
    wavArray.set(new Uint8Array(wavHeader), 0);
    wavArray.set(new Uint8Array(int16Data.buffer), wavHeader.byteLength);
    
    return wavArray;
  }

  reset() {
    this.queue = [];
    this.isPlaying = false;
  }
}

export class RealtimeChat {
  private ws: WebSocket | null = null;
  private recorder: AudioRecorder | null = null;
  private audioQueue: AudioQueue;
  private sessionStarted = false;
  private isListening = false;

  constructor(private onTranscript: (text: string) => void) {
    this.audioQueue = new AudioQueue();
  }

  async connect() {
    try {
      // Connect to our Supabase Edge Function WebSocket
      this.ws = new WebSocket(`wss://oseowhythgbqvllwonaz.functions.supabase.co/realtime-chat`);
      
      this.ws.onopen = () => {
        console.log("Connected to WebSocket server");
      };
      
      this.ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          console.log("Received event:", data);
          
          if (data.type === "session.created") {
            console.log("Session created, sending configuration");
            this.sessionStarted = true;
            this.sendSessionConfig();
          } 
          else if (data.type === "response.audio.delta") {
            // Handle audio delta - convert base64 to binary data
            const binaryString = atob(data.delta);
            const bytes = new Uint8Array(binaryString.length);
            for (let i = 0; i < binaryString.length; i++) {
              bytes[i] = binaryString.charCodeAt(i);
            }
            this.audioQueue.addToQueue(bytes);
          }
          else if (data.type === "response.audio_transcript.delta") {
            // Handle text transcripts
            if (data.delta && this.onTranscript) {
              this.onTranscript(data.delta);
            }
          }
        } catch (error) {
          console.error("Error processing WebSocket message:", error);
        }
      };
      
      this.ws.onclose = () => {
        console.log("WebSocket connection closed");
        this.cleanup();
      };
      
      this.ws.onerror = (error) => {
        console.error("WebSocket error:", error);
      };
      
      // Start recording audio
      this.recorder = new AudioRecorder((audioData) => {
        if (this.ws && this.ws.readyState === WebSocket.OPEN && this.sessionStarted) {
          const encodedAudio = encodeAudioForAPI(audioData);
          this.ws.send(JSON.stringify({
            type: 'input_audio_buffer.append',
            audio: encodedAudio
          }));
        }
      });
      
      await this.recorder.start();
      this.isListening = true;
      
    } catch (error) {
      console.error("Error connecting to chat:", error);
      this.cleanup();
      throw error;
    }
  }

  private sendSessionConfig() {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify({
        event_id: "config_" + Date.now(),
        type: "session.update",
        session: {
          modalities: ["text", "audio"],
          instructions: "You are a helpful assistant that speaks naturally with users. Keep responses concise and conversational.",
          voice: "alloy",
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
      }));
    }
  }

  sendMessage(text: string) {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
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
      
      this.ws.send(JSON.stringify(event));
      this.ws.send(JSON.stringify({type: 'response.create'}));
    }
  }

  disconnect() {
    this.cleanup();
  }

  private cleanup() {
    if (this.recorder) {
      this.recorder.stop();
      this.recorder = null;
    }
    
    if (this.ws) {
      if (this.ws.readyState === WebSocket.OPEN) {
        this.ws.close();
      }
      this.ws = null;
    }
    
    this.audioQueue.reset();
    this.sessionStarted = false;
    this.isListening = false;
  }

  get isConnected(): boolean {
    return this.ws !== null && this.ws.readyState === WebSocket.OPEN;
  }
}
