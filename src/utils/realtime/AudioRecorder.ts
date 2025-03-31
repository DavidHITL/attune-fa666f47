
export interface AudioRecorderOptions {
  onAudioData?: (audioData: Float32Array) => void;
  sampleRate?: number;
  chunkSize?: number;
}

export class AudioRecorder {
  private stream: MediaStream | null = null;
  private audioContext: AudioContext | null = null;
  private processor: ScriptProcessorNode | null = null;
  private source: MediaStreamAudioSourceNode | null = null;
  private options: AudioRecorderOptions;
  private isRecording: boolean = false;

  constructor(options: AudioRecorderOptions = {}) {
    this.options = {
      sampleRate: 24000, // OpenAI requires 24kHz
      chunkSize: 4096,
      ...options
    };
  }

  /**
   * Start recording audio from the microphone
   */
  async start(): Promise<boolean> {
    if (this.isRecording) {
      console.log("[AudioRecorder] Already recording");
      return true;
    }

    try {
      console.log("[AudioRecorder] Starting audio recording");
      
      // Request access to the microphone
      this.stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          sampleRate: this.options.sampleRate,
          channelCount: 1,
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        }
      });
      
      // Create audio context with the specified sample rate
      this.audioContext = new AudioContext({
        sampleRate: this.options.sampleRate
      });
      
      // Create source from the microphone stream
      this.source = this.audioContext.createMediaStreamSource(this.stream);
      
      // Create processor node to process audio data
      this.processor = this.audioContext.createScriptProcessor(
        this.options.chunkSize, 
        1, // Input channels
        1  // Output channels
      );
      
      // Set up the audio processing callback
      this.processor.onaudioprocess = (e) => {
        const inputData = e.inputBuffer.getChannelData(0);
        
        if (this.options.onAudioData) {
          // Create a copy of the audio data to prevent mutation
          this.options.onAudioData(new Float32Array(inputData));
        }
      };
      
      // Connect the nodes
      this.source.connect(this.processor);
      this.processor.connect(this.audioContext.destination);
      
      this.isRecording = true;
      console.log("[AudioRecorder] Recording started");
      
      return true;
    } catch (error) {
      console.error("[AudioRecorder] Error starting recording:", error);
      this.stop(); // Clean up any partially created resources
      return false;
    }
  }

  /**
   * Stop recording audio
   */
  stop(): void {
    console.log("[AudioRecorder] Stopping recording");
    
    // Disconnect and clean up source
    if (this.source) {
      this.source.disconnect();
      this.source = null;
    }
    
    // Disconnect and clean up processor
    if (this.processor) {
      this.processor.disconnect();
      this.processor = null;
    }
    
    // Stop all tracks in the stream
    if (this.stream) {
      this.stream.getTracks().forEach(track => track.stop());
      this.stream = null;
    }
    
    // Close audio context
    if (this.audioContext) {
      this.audioContext.close().catch(err => {
        console.error("[AudioRecorder] Error closing AudioContext:", err);
      });
      this.audioContext = null;
    }
    
    this.isRecording = false;
    console.log("[AudioRecorder] Recording stopped");
  }

  /**
   * Get whether recording is currently active
   */
  isActive(): boolean {
    return this.isRecording;
  }
}
