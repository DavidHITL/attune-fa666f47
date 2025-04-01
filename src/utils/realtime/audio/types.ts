
export interface AudioRecorderOptions {
  onAudioData?: (audioData: Float32Array) => void;
  onSilenceDetected?: () => void;
  sampleRate?: number;
  chunkSize?: number;
  timeslice?: number;
  silenceThreshold?: number;
  silenceDuration?: number;
}

export interface AudioRecorderInterface {
  start(reuseExistingStream?: boolean): Promise<boolean>;
  stop(releaseStream?: boolean): void;
  setExistingMediaStream(stream: MediaStream): void;
  isActive(): boolean;
  getMediaStream(): MediaStream | null;
  getAudioTrack(): MediaStreamTrack | null;
}
