import { AudioPlaybackManager } from "@/utils/realtime/audio/AudioPlaybackManager";
import { User } from "@supabase/supabase-js";
import React from "react";

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

export interface UseConnectionErrorHandlerProps {
  userId?: string;
  connectionAttempts: number;
  maxConnectionAttempts: number;
  setConnectionAttempts: React.Dispatch<React.SetStateAction<number>>;
  connect: () => Promise<void>;
}

export interface UseVoiceChatEffectsProps {
  isConnected: boolean;
  isAiSpeaking: boolean;
  currentTranscript: string;
  user: User | null;
  systemPrompt?: string;
  disconnect: () => void;
}
