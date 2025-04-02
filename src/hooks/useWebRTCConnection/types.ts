import { AudioPlaybackManager } from "@/utils/realtime/audio/AudioPlaybackManager";

// Define the structure for WebRTC messages
export interface WebRTCMessage {
  id: string;
  text: string;
  isUser: boolean;
  timestamp: Date;
}

// Define the options for the useWebRTCConnection hook
// Add onError to the interface
export interface UseWebRTCConnectionOptions {
  model?: string;
  voice?: "alloy" | "echo" | "fable" | "onyx" | "nova" | "shimmer";
  instructions?: string;
  userId?: string;
  autoConnect?: boolean;
  enableMicrophone?: boolean;
  onError?: (error: Error) => void;
}

// Define the result type for the useWebRTCConnection hook
export interface WebRTCConnectionResult {
  isConnected: boolean;
  isConnecting: boolean;
  isMicrophoneActive: boolean;
  isAiSpeaking: boolean;
  isProcessingAudio: boolean;
  currentTranscript: string;
  transcriptProgress: number;
  messages: WebRTCMessage[];
  isDataChannelReady: boolean;
  connect: () => Promise<void>;
  disconnect: () => void;
  toggleMicrophone: () => void;
  sendTextMessage: (text: string) => void;
  commitAudioBuffer: (audioData: Float32Array) => void;
  getActiveMediaStream: () => MediaStream | null;
  getActiveAudioTrack: () => MediaStreamTrack | null;
  setAudioPlaybackManager: (manager: AudioPlaybackManager) => void;
}

export interface WebRTCConnectionState {
  isConnected: boolean;
  isConnecting: boolean;
  isMicrophoneActive: boolean;
  isAiSpeaking: boolean;
  currentTranscript: string;
  messages: WebRTCMessage[];
}
