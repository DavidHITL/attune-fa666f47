
export interface WebRTCMessage {
  type: string;
  text?: string;
  delta?: string;
  audio?: string;
  // Add session property to fix type errors
  session?: {
    instructions?: string;
    modalities?: string[];
    voice?: string;
    temperature?: number;
    priority_hints?: string[];
    [key: string]: any; // Allow for other session properties
  };
}

export interface MessageMetadata {
  messageType: 'text' | 'voice';
  instructions?: string;
  knowledgeEntries?: any;
}

export interface WebRTCMessageHandlerOptions {
  onTranscriptUpdate?: (text: string) => void;
  onTranscriptComplete?: () => void;
  onAudioData?: (base64Audio: string) => void;
  onAudioComplete?: () => void;
  onMessageReceived?: (message: WebRTCMessage) => void;
  onFinalTranscript?: (transcript: string) => void;
  instructions?: string;
}

export interface UseWebRTCConnectionOptions {
  model?: string;
  voice?: "alloy" | "echo" | "fable" | "onyx" | "nova" | "shimmer";
  instructions?: string;
  userId?: string; // Add userId to options
  autoConnect?: boolean;
  enableMicrophone?: boolean;
  apiKey?: string;
  onMessage?: (message: WebRTCMessage) => void;
  onTrack?: (event: RTCTrackEvent) => void;
}

/**
 * Result object returned by useWebRTCConnection hook
 */
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
  connect: () => Promise<boolean>;
  disconnect: () => void;
  toggleMicrophone: () => Promise<boolean>;
  sendTextMessage: (text: string) => boolean;
  commitAudioBuffer: () => boolean;
  getActiveMediaStream: () => MediaStream | null;
  getActiveAudioTrack: () => MediaStreamTrack | null;
  setAudioPlaybackManager?: (manager: any) => void;
}

// Add the missing WebRTCConnectionState interface
export interface WebRTCConnectionState {
  isConnected: boolean;
  isConnecting: boolean;
  isMicrophoneActive: boolean;
  isAiSpeaking: boolean;
  currentTranscript: string;
  messages: WebRTCMessage[];
}
