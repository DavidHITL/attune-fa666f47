
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
  currentTranscript: string;
  messages: WebRTCMessage[];
}

export interface WebRTCConnectionActions {
  connect: () => Promise<boolean>;
  disconnect: () => void;
  toggleMicrophone: () => Promise<boolean>;
  sendTextMessage: (text: string) => boolean;
}

export type WebRTCConnectionResult = WebRTCConnectionState & WebRTCConnectionActions;
