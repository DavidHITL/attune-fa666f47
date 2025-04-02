
import { AudioPlaybackManager } from "@/utils/realtime/audio/AudioPlaybackManager";

// Define the structure for WebRTC messages
export interface WebRTCMessage {
  id: string;
  text: string;
  isUser: boolean;
  timestamp: Date;
  type?: string;
  delta?: string;
  session?: any;
}

// Define message metadata for storage and context
export interface MessageMetadata {
  userId?: string;
  messageType?: 'text' | 'voice' | 'system';
  instructions?: string;
  knowledgeEntries?: any[];
}

// Define options for WebRTCMessageHandler
export interface WebRTCMessageHandlerOptions {
  onTranscriptUpdate?: (text: string) => void;
  onTranscriptComplete?: () => void;
  onAudioData?: (base64Audio: string) => void;
  onAudioComplete?: () => void;
  onMessageReceived?: (message: WebRTCMessage) => void;
  onFinalTranscript?: (transcript: string) => void;
  instructions?: string;
  knowledgeEntries?: any[];
  userId?: string;
}

// Define the options for the useWebRTCConnection hook
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
  toggleMicrophone: () => Promise<void>;
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

// Add WebRTCOptions interface to align with the imports
export interface WebRTCOptions {
  model?: string;
  voice?: "alloy" | "echo" | "fable" | "onyx" | "nova" | "shimmer";
  instructions?: string;
  userId?: string;
  onMessage?: (event: MessageEvent) => void;
  onTrack?: (event: RTCTrackEvent) => void;
  onConnectionStateChange?: (state: RTCPeerConnectionState) => void;
  onError?: (error: any) => void;
}
