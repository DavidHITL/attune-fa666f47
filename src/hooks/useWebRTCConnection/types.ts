
import { WebRTCOptions } from "@/utils/realtime/WebRTCTypes";

export interface WebRTCMessage {
  type: string;
  content: string;
  isUser: boolean;
  delta?: string; // Add delta property for audio and transcript fragments
}

export interface UseWebRTCConnectionOptions extends WebRTCOptions {
  autoConnect?: boolean;
  enableMicrophone?: boolean;
}

export interface WebRTCConnectionResult {
  isConnected: boolean;
  isConnecting: boolean;
  isMicrophoneActive: boolean;
  isAiSpeaking: boolean;
  isProcessingAudio?: boolean;
  currentTranscript: string;
  transcriptProgress?: number;
  messages: WebRTCMessage[];
  isDataChannelReady?: boolean;
  connect: () => Promise<boolean>;
  disconnect: () => void;
  toggleMicrophone: () => Promise<boolean>;
  sendTextMessage: (text: string) => boolean;
  getActiveMediaStream: () => MediaStream | null;
  getActiveAudioTrack: () => MediaStreamTrack | null;
}

// Add the WebRTCConnectionState interface
export interface WebRTCConnectionState {
  isConnected: boolean;
  isConnecting: boolean;
  isMicrophoneActive: boolean;
  isAiSpeaking: boolean;
  currentTranscript: string;
  messages: WebRTCMessage[];
}

// Add MessageMetadata interface
export interface MessageMetadata {
  messageType: 'text' | 'voice';
  instructions?: string;
  knowledgeEntries?: string[];
}
