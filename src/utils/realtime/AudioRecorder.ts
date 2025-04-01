
export interface AudioRecorderOptions {
  onAudioData?: (audioData: Float32Array) => void;
  onSilenceDetected?: () => void;
  sampleRate?: number;
  chunkSize?: number;
  timeslice?: number;
  silenceThreshold?: number;
  silenceDuration?: number;
}

export class AudioRecorder {
  private stream: MediaStream | null = null;
  private audioContext: AudioContext | null = null;
  private processor: ScriptProcessorNode | null = null;
  private source: MediaStreamAudioSourceNode | null = null;
  private options: AudioRecorderOptions;
  private isRecording: boolean = false;
  private processingInterval: ReturnType<typeof setInterval> | null = null;
  private lastAudioSentTimestamp: number = 0;
  
  // Silence detection properties
  private silenceStart: number | null = null;
  private isSilent: boolean = false;
  private lastVolume: number = 0;

  constructor(options: AudioRecorderOptions = {}) {
    this.options = {
      sampleRate: 16000, // OpenAI recommends 16kHz
      chunkSize: 4096,
      timeslice: 100, // Send audio data every 100ms
      silenceThreshold: 0.01, // Default silence threshold (very quiet)
      silenceDuration: 1500, // 1.5 seconds of silence to trigger end of speech
      ...options
    };
  }

  /**
   * Set an existing MediaStream instead of creating a new one
   * Useful for reusing a stream that's already been requested
   */
  setExistingMediaStream(stream: MediaStream): void {
    this.stream = stream;
  }

  /**
   * Start recording audio from the microphone
   * @param reuseExistingStream If true, will use the existing stream if available
   */
  async start(reuseExistingStream: boolean = false): Promise<boolean> {
    if (this.isRecording) {
      console.log("[AudioRecorder] Already recording");
      return true;
    }

    try {
      console.log("[AudioRecorder] Starting audio recording");
      
      // If we don't have a stream yet or we're not reusing an existing one, request a new one
      if (!this.stream || !reuseExistingStream) {
        // Request access to the microphone with explicit constraints
        this.stream = await navigator.mediaDevices.getUserMedia({
          audio: {
            sampleRate: this.options.sampleRate,
            channelCount: 1,
            echoCancellation: true,
            noiseSuppression: true,
            autoGainControl: true
          }
        });
        console.log("[AudioRecorder] New MediaStream created with", 
          this.stream.getAudioTracks().length, 
          "audio tracks");
          
        // Verify we actually have audio tracks
        if (this.stream.getAudioTracks().length === 0) {
          console.error("[AudioRecorder] No audio tracks found in MediaStream");
          return false;
        }
      } else {
        console.log("[AudioRecorder] Reusing existing MediaStream with", 
          this.stream.getAudioTracks().length, 
          "audio tracks");
          
        // Verify the existing stream has active audio tracks
        const activeTracks = this.stream.getAudioTracks().filter(track => track.readyState === 'live');
        if (activeTracks.length === 0) {
          console.error("[AudioRecorder] No active audio tracks in the existing MediaStream");
          return false;
        }
      }
      
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
      
      // Reset silence detection state
      this.silenceStart = null;
      this.isSilent = false;
      
      // Set up the audio processing callback to continuously process audio data
      this.processor.onaudioprocess = (e) => {
        const inputData = e.inputBuffer.getChannelData(0);
        
        // Check for silence
        this.detectSilence(inputData);
        
        if (this.options.onAudioData) {
          // Create a copy of the audio data to prevent mutation
          const now = Date.now();
          this.lastAudioSentTimestamp = now;
          this.options.onAudioData(new Float32Array(inputData));
        }
      };
      
      // Connect the nodes
      this.source.connect(this.processor);
      this.processor.connect(this.audioContext.destination);
      
      // Ensure audio is flowing by setting up a watchdog timer
      this.setupAudioFlowWatchdog();
      
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
   * Detect silence in audio data and trigger callback when silence duration threshold is met
   * @param audioData Float32Array of audio samples
   */
  private detectSilence(audioData: Float32Array): void {
    // Calculate RMS volume of the audio chunk
    let sum = 0;
    for (let i = 0; i < audioData.length; i++) {
      sum += audioData[i] * audioData[i];
    }
    const rmsVolume = Math.sqrt(sum / audioData.length);
    this.lastVolume = rmsVolume;
    
    const now = Date.now();
    const isSilentNow = rmsVolume < (this.options.silenceThreshold || 0.01);
    
    // Handle transition to silence
    if (!this.isSilent && isSilentNow) {
      this.isSilent = true;
      this.silenceStart = now;
      console.debug(`[AudioRecorder] Silence detected, volume: ${rmsVolume.toFixed(5)}`);
    }
    // Handle transition to sound
    else if (this.isSilent && !isSilentNow) {
      this.isSilent = false;
      this.silenceStart = null;
      console.debug(`[AudioRecorder] Sound detected, volume: ${rmsVolume.toFixed(5)}`);
    }
    
    // Check if silence has lasted long enough to trigger the callback
    if (this.isSilent && this.silenceStart && 
        (now - this.silenceStart) > (this.options.silenceDuration || 1500) && 
        this.options.onSilenceDetected) {
      console.log(`[AudioRecorder] Prolonged silence detected (${now - this.silenceStart}ms)`);
      this.options.onSilenceDetected();
      // Reset silence start to prevent multiple triggers
      this.silenceStart = null;
    }
  }

  /**
   * Set up a watchdog to monitor if audio is flowing correctly
   * Will log warnings if no audio data is being processed
   */
  private setupAudioFlowWatchdog() {
    // Clear any existing interval
    if (this.processingInterval !== null) {
      clearInterval(this.processingInterval);
    }
    
    this.lastAudioSentTimestamp = Date.now();
    
    this.processingInterval = setInterval(() => {
      const now = Date.now();
      const timeSinceLastAudio = now - this.lastAudioSentTimestamp;
      
      // If no audio data has been processed for 1 second, log a warning
      if (timeSinceLastAudio > 1000) {
        console.warn("[AudioRecorder] No audio data has been processed for", 
          timeSinceLastAudio, "ms");
      }
      
      // Log volume level periodically
      console.debug(`[AudioRecorder] Current volume level: ${this.lastVolume.toFixed(5)}, ` +
        `silence: ${this.isSilent}, ` +
        `silence duration: ${this.silenceStart ? now - this.silenceStart : 0}ms`);
    }, 2000);
  }

  /**
   * Stop recording audio
   * @param releaseStream If true, will stop all tracks in the stream
   */
  stop(releaseStream: boolean = true): void {
    console.log("[AudioRecorder] Stopping recording");
    
    // Clear processing interval if it exists
    if (this.processingInterval !== null) {
      clearInterval(this.processingInterval);
      this.processingInterval = null;
    }

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
    
    // Stop all tracks in the stream if requested
    if (this.stream && releaseStream) {
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

  /**
   * Get the current MediaStream if recording is active
   * @returns The active MediaStream or null if not recording
   */
  getMediaStream(): MediaStream | null {
    return this.stream;
  }

  /**
   * Get an audio track from the MediaStream if available
   * @returns The first audio track or null if not available
   */
  getAudioTrack(): MediaStreamTrack | null {
    if (!this.stream) return null;
    const tracks = this.stream.getAudioTracks();
    return tracks.length > 0 ? tracks[0] : null;
  }
}
