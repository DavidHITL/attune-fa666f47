
import { SilenceDetector } from './SilenceDetector';
import { AudioContextManager } from './AudioContextManager';
import { AudioSender } from '../connector/AudioSender';

export class AudioProcessingManager {
  private readonly chunkSize: number;
  private readonly sampleRate: number;
  private readonly silenceDetector: SilenceDetector;
  private readonly onAudioData: ((audioData: Float32Array) => void) | undefined;
  private scriptProcessor: ScriptProcessorNode | null = null;
  private audioContextManager: AudioContextManager;
  private sourceNode: MediaStreamAudioSourceNode | null = null;
  private lastAudioSent: number = Date.now();
  private silenceDetectionEnabled: boolean = true;

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
    this.audioContextManager = new AudioContextManager();
  }

  /**
   * Sets up audio processing with the given MediaStream.
   * @param stream The MediaStream to process.
   * @returns True if setup succeeds, false otherwise.
   */
  setupProcessing(stream: MediaStream): boolean {
    try {
      // Create audio context or resume existing
      const audioContext = this.audioContextManager.getAudioContext();
      if (!audioContext) {
        console.error("[AudioProcessingManager] Could not get or create AudioContext");
        return false;
      }

      // Create a source node from the stream
      this.sourceNode = audioContext.createMediaStreamSource(stream);

      // Create a script processor node for real-time audio processing
      this.scriptProcessor = audioContext.createScriptProcessor(this.chunkSize, 1, 1);
      this.scriptProcessor.onaudioprocess = (event: AudioProcessingEvent) => {
        const audioData = event.inputBuffer.getChannelData(0);

        // Mark audio as sent
        if (audioData && audioData.length > 0) {
          AudioSender.markAudioSent();
          this.lastAudioSent = Date.now();
        }

        // Only perform silence detection if enabled
        if (this.silenceDetectionEnabled) {
          // Detect silence
          if (this.silenceDetector.isSilence(audioData)) {
            this.silenceDetector.incrementSilenceFrames();
            
            // Log some debugging info about silence detection
            if (this.silenceDetector.getSilenceFrames() % 5 === 0) {
              console.log(`[AudioProcessingManager] Silence detected for ${this.silenceDetector.getSilenceFrames()} frames`);
            }
          } else {
            this.silenceDetector.resetSilenceFrames();
          }

          // Trigger silence detected callback if silence duration is exceeded
          if (this.silenceDetector.isSilenceDurationExceeded()) {
            console.log("[AudioProcessingManager] Silence duration exceeded, triggering callback");
            this.silenceDetector.onSilenceDetected();
            this.silenceDetector.reset();
            
            // Temporarily disable silence detection after triggering to prevent multiple triggers
            this.disableSilenceDetection(2000);
          }
        }

        // Invoke the callback with the audio data
        if (this.onAudioData) {
          this.onAudioData(audioData);
        }
      };

      // Connect the nodes
      this.sourceNode.connect(this.scriptProcessor);
      this.scriptProcessor.connect(audioContext.destination);

      console.log("[AudioProcessingManager] Audio processing setup complete");
      return true;
    } catch (error) {
      console.error("[AudioProcessingManager] Error setting up audio processing:", error);
      return false;
    }
  }

  /**
   * Temporarily disable silence detection, useful after committing audio
   * to prevent multiple commits in rapid succession.
   * @param duration How long to disable silence detection for (ms)
   */
  disableSilenceDetection(duration: number = 2000): void {
    this.silenceDetectionEnabled = false;
    setTimeout(() => {
      this.silenceDetectionEnabled = true;
      this.silenceDetector.reset();
      console.log("[AudioProcessingManager] Re-enabling silence detection");
    }, duration);
  }

  /**
   * Cleans up the audio processing resources.
   */
  cleanup(): void {
    try {
      if (this.sourceNode) {
        this.sourceNode.disconnect();
        this.sourceNode = null;
      }

      if (this.scriptProcessor) {
        this.scriptProcessor.disconnect();
        this.scriptProcessor.onaudioprocess = null;
        this.scriptProcessor = null;
      }

      this.audioContextManager.closeAudioContext();

      console.log("[AudioProcessingManager] Audio processing cleanup complete");
    } catch (error) {
      console.error("[AudioProcessingManager] Error during audio processing cleanup:", error);
    }
  }
  
  /**
   * Check if audio has been silent for longer than the specified duration
   * @param durationMs Duration in milliseconds
   * @returns True if no audio has been sent for the specified duration
   */
  isAudioInactiveLongerThan(durationMs: number): boolean {
    return Date.now() - this.lastAudioSent > durationMs;
  }
}
