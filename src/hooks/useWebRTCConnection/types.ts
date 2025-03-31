
import { WebRTCOptions } from "@/utils/realtime/WebRTCTypes";

export interface UseWebRTCConnectionOptions extends WebRTCOptions {
  autoConnect?: boolean;
  enableMicrophone?: boolean;
}

export interface WebRTCMessage {
  type: string;
  [key: string]: any;
}

export interface WebRTCConnectionState {
  isConnected: boolean;
  isConnecting: boolean;
  isMicrophoneActive: boolean;
  isAiSpeaking: boolean;
  isProcessingAudio?: boolean;
  currentTranscript: string;
  transcriptProgress?: number;
  messages: WebRTCMessage[];
}

export interface WebRTCConnectionActions {
  connect: () => Promise<boolean>;
  disconnect: () => void;
  toggleMicrophone: () => Promise<boolean>;
  sendTextMessage: (text: string) => boolean;
}

export type WebRTCConnectionResult = WebRTCConnectionState & WebRTCConnectionActions;

// Extended message types for storage
export interface MessageMetadata {
  messageType: 'text' | 'voice';
  instructions?: string;
  knowledgeEntries?: Record<string, any>[];
}
