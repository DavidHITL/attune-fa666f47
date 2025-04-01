import { WebRTCOptions } from "@/utils/realtime/WebRTCTypes";

export interface WebRTCMessage {
  type: string;
  content: string;
  isUser: boolean;
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
