
export interface WebRTCMessage {
  type: string;
  text?: string;
  delta?: string;
  audio?: string;
}

export interface MessageMetadata {
  messageType: 'text' | 'voice';
  instructions?: string;
  knowledgeEntries?: any; // Add the missing property
}

export interface UseWebRTCConnectionOptions {
  model?: string;
  voice?: "alloy" | "echo" | "fable" | "onyx" | "nova" | "shimmer";
  instructions?: string;
  autoConnect?: boolean;
  enableMicrophone?: boolean;
  apiKey?: string;
  onMessage?: (message: WebRTCMessage) => void;
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
