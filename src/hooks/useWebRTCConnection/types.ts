
// Update the types.ts file to expose the new methods in the return types
import { WebRTCOptions } from "@/utils/realtime/WebRTCTypes";

export type WebRTCMessageRole = "user" | "assistant" | "system";

export interface WebRTCMessageContent {
  type: "text" | "audio" | "function_call" | "function_response";
  text?: string;
  audio?: string;
  functionCall?: {
    name: string;
    arguments: string;
  };
  functionResponse?: {
    name: string;
    response: string;
  };
}

export interface WebRTCMessage {
  id: string;
  role: WebRTCMessageRole;
  content: WebRTCMessageContent[];
  timestamp: number;
  // Add properties used in WebRTCMessageHandler and useAudioProcessor
  type?: string;
  delta?: string;
  event_id?: string;
  response_id?: string;
}

export interface UseWebRTCConnectionOptions extends Partial<WebRTCOptions> {
  autoConnect?: boolean;
  enableMicrophone?: boolean;
}

export interface WebRTCConnectionState {
  isConnected: boolean;
  isConnecting: boolean;
  isMicrophoneActive: boolean;
  isAiSpeaking: boolean;
  currentTranscript: string;
  messages: WebRTCMessage[];
}

export interface WebRTCConnectionResult extends WebRTCConnectionState {
  isProcessingAudio: boolean;
  transcriptProgress: number;
  connect: () => Promise<boolean>;
  disconnect: () => void;
  toggleMicrophone: () => Promise<boolean>;
  sendTextMessage: (text: string) => boolean;
  getActiveMediaStream: () => MediaStream | null;
  getActiveAudioTrack: () => MediaStreamTrack | null;
}

// Add MessageMetadata interface which is referenced in multiple files
export interface MessageMetadata {
  messageType: 'text' | 'voice';
  instructions?: string;
  knowledgeEntries?: string[];
}
