
import { SilenceDetector } from './SilenceDetector';

export class AudioProcessingManager {
  private audioContext: AudioContext | null = null;
  private processor: ScriptProcessorNode | null = null;
  private source: MediaStreamAudioSourceNode | null = null;
  private silenceDetector: SilenceDetector;
  private lastAudioSentTimestamp: number = 0;
  private processingInterval: ReturnType<typeof setInterval> | null = null;
  private readonly onAudioData?: (audioData: Float32Array) => void;
  private readonly chunkSize: number;
  private readonly sampleRate: number;

  constructor(
    chunkSize: number,
    sampleRate: number,
    silenceDetector: SilenceDetector,
    onAudioData?: (audioData: Float32Array) => void
  ) {
    this.chunkSize = chunkSize;
    this.sampleRate = sampleRate;
    this.silenceDetector = silenceDetector;
    this.onAudioData = onAudioData;
  }

  /**
   * Set up audio processing for the stream
   * @param stream Audio stream to process
   * @returns True if successful, false otherwise
   */
  setupProcessing(stream: MediaStream): boolean {
    try {
      // Create audio context with the specified sample rate
      this.audioContext = new AudioContext({
        sampleRate: this.sampleRate
      });
      
      // Create source from the stream
      this.source = this.audioContext.createMediaStreamSource(stream);
      
      // Create processor node to process audio data
      this.processor = this.audioContext.createScriptProcessor(
        this.chunkSize, 
        1, // Input channels
        1  // Output channels
      );
      
      // Set up the audio processing callback
      this.processor.onaudioprocess = (e) => {
        const inputData = e.inputBuffer.getChannelData(0);
        
        // Check for silence
        this.silenceDetector.detectSilence(inputData);
        
        if (this.onAudioData) {
          const now = Date.now();
          this.lastAudioSentTimestamp = now;
          this.onAudioData(new Float32Array(inputData));
        }
      };
      
      // Connect the nodes
      this.source.connect(this.processor);
      this.processor.connect(this.audioContext.destination);
      
      // Setup monitoring to ensure audio is flowing
      this.setupAudioFlowWatchdog();
      
      return true;
    } catch (error) {
      console.error("[AudioProcessingManager] Error setting up audio processing:", error);
      return false;
    }
  }

  /**
   * Set up a watchdog to monitor if audio is flowing correctly
   */
  setupAudioFlowWatchdog() {
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
        console.warn("[AudioProcessingManager] No audio data has been processed for", 
          timeSinceLastAudio, "ms");
      }
      
      // Log volume level periodically
      const silenceInfo = this.silenceDetector.getSilenceInfo();
      console.debug(
        `[AudioProcessingManager] Current volume level: ${silenceInfo.lastVolume.toFixed(5)}, ` +
        `silence: ${silenceInfo.isSilent}, ` +
        `silence duration: ${silenceInfo.silenceDuration || 0}ms`
      );
    }, 2000);
  }

  /**
   * Clean up audio processing resources
   */
  cleanup() {
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
    
    // Close audio context
    if (this.audioContext) {
      this.audioContext.close().catch(err => {
        console.error("[AudioProcessingManager] Error closing AudioContext:", err);
      });
      this.audioContext = null;
    }
  }
}
