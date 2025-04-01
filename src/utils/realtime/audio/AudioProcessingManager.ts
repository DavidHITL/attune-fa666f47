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
        }

        // Detect silence
        if (this.silenceDetector.isSilence(audioData)) {
          this.silenceDetector.incrementSilenceFrames();
        } else {
          this.silenceDetector.resetSilenceFrames();
        }

        // Trigger silence detected callback if silence duration is exceeded
        if (this.silenceDetector.isSilenceDurationExceeded()) {
          this.silenceDetector.onSilenceDetected();
          this.silenceDetector.reset();
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
}
