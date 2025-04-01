
import { AudioRecorderOptions, AudioRecorderInterface } from './types';
import { SilenceDetector } from './SilenceDetector';
import { AudioProcessingManager } from './AudioProcessingManager';

export class AudioRecorder implements AudioRecorderInterface {
  private stream: MediaStream | null = null;
  private options: AudioRecorderOptions;
  private isRecording: boolean = false;
  private silenceDetector: SilenceDetector;
  private audioProcessingManager: AudioProcessingManager | null = null;

  constructor(options: AudioRecorderOptions = {}) {
    this.options = {
      sampleRate: 16000, // OpenAI recommends 16kHz
      chunkSize: 4096,
      timeslice: 100, // Send audio data every 100ms
      silenceThreshold: 0.01, // Default silence threshold (very quiet)
      silenceDuration: 1500, // 1.5 seconds of silence to trigger end of speech
      ...options
    };

    // Create silence detector
    this.silenceDetector = new SilenceDetector(
      this.options.silenceThreshold,
      this.options.silenceDuration,
      this.options.onSilenceDetected
    );
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
        this.stream = await this.requestMicrophoneStream();
        
        // Verify we actually have audio tracks
        if (!this.stream || this.stream.getAudioTracks().length === 0) {
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
      
      // Reset silence detection state
      this.silenceDetector.reset();
      
      // Create audio processing manager
      this.audioProcessingManager = new AudioProcessingManager(
        this.options.chunkSize || 4096,
        this.options.sampleRate || 16000,
        this.silenceDetector,
        this.options.onAudioData
      );
      
      // Set up audio processing
      const setupSuccess = this.audioProcessingManager.setupProcessing(this.stream);
      if (!setupSuccess) {
        console.error("[AudioRecorder] Failed to set up audio processing");
        this.cleanup();
        return false;
      }
      
      this.isRecording = true;
      console.log("[AudioRecorder] Recording started");
      
      return true;
    } catch (error) {
      console.error("[AudioRecorder] Error starting recording:", error);
      this.cleanup();
      return false;
    }
  }

  /**
   * Request access to the microphone with specific constraints
   * @returns MediaStream or null if request fails
   */
  private async requestMicrophoneStream(): Promise<MediaStream | null> {
    try {
      // Request access to the microphone with explicit constraints
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          sampleRate: this.options.sampleRate,
          channelCount: 1,
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        }
      });
      
      console.log("[AudioRecorder] New MediaStream created with", 
        stream.getAudioTracks().length, 
        "audio tracks");
      
      return stream;
    } catch (error) {
      console.error("[AudioRecorder] Failed to access microphone:", error);
      return null;
    }
  }

  /**
   * Stop recording audio
   * @param releaseStream If true, will stop all tracks in the stream
   */
  stop(releaseStream: boolean = true): void {
    console.log("[AudioRecorder] Stopping recording");
    
    // Clean up audio processing
    if (this.audioProcessingManager) {
      this.audioProcessingManager.cleanup();
      this.audioProcessingManager = null;
    }
    
    // Stop all tracks in the stream if requested
    if (this.stream && releaseStream) {
      this.stream.getTracks().forEach(track => track.stop());
      this.stream = null;
    }
    
    this.isRecording = false;
    console.log("[AudioRecorder] Recording stopped");
  }

  /**
   * Clean up resources when recording fails to start
   */
  private cleanup(): void {
    if (this.audioProcessingManager) {
      this.audioProcessingManager.cleanup();
      this.audioProcessingManager = null;
    }
    
    if (this.stream) {
      this.stream.getTracks().forEach(track => track.stop());
      this.stream = null;
    }
    
    this.isRecording = false;
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
