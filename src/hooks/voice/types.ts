import { ReactNode } from "react";
import { User } from "@supabase/supabase-js";
import { AudioPlaybackManager } from "@/utils/realtime/audio/AudioPlaybackManager";

/**
 * Props for the VoiceChatProvider component
 */
export interface VoiceChatProviderProps {
  children: ReactNode;
  systemPrompt?: string;
  voice?: "alloy" | "echo" | "fable" | "onyx" | "nova" | "shimmer";
  onClose?: () => void;
}

/**
 * Context interface for the VoiceChatContext
 */
export interface VoiceChatContextProps {
  // Connection state
  isConnected: boolean;
  isConnecting: boolean;
  isMicrophoneActive: boolean;
  isAiSpeaking: boolean;
  isProcessingAudio: boolean;
  currentTranscript: string;
  transcriptProgress: number;
  connectionAttempts: number;
  contextLoaded: boolean;
  contextLoadError: string | null;
  
  // References
  audioRef: React.RefObject<HTMLAudioElement>;
  audioPlaybackManager: React.MutableRefObject<AudioPlaybackManager | null>;
  
  // Functions
  connect: () => Promise<void>;
  disconnect: () => void;
  handleMicrophoneToggle: () => Promise<boolean>;
  getActiveMediaStream: () => MediaStream | null;
  sendTextMessage: (text: string) => void;
  handleSubmit: (text: string) => void;
  
  // Other props
  systemPrompt?: string;
  voice?: string;
  microphonePermission: PermissionState | null;
  user: User | null;
}

/**
 * Context verification parameters
 */
export interface ContextVerificationParams {
  userId?: string;
  activeMode: 'text' | 'voice';
  sessionStarted: boolean;
  sessionProgress?: number;
}
