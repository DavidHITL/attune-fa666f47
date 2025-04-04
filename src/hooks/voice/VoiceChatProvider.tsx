
import React, { createContext, ReactNode, useRef, useState, useEffect, useCallback } from "react";
import { useAuth } from "@/context/AuthContext";
import { useAudioPlaybackManager } from "./useAudioPlaybackManager";
import { useVoiceConnectionSetup } from "./useVoiceConnectionSetup";
import { useVoiceContextLoading } from "./useVoiceContextLoading";
import { useVoiceMicrophoneHandler } from "@/hooks/useVoiceMicrophoneHandler";
import { useVoiceChatEffects } from "./useVoiceChatEffects";
import { VoiceChatContextProps } from "./types";
import { toast } from "sonner";

// Create the context
export const VoiceChatContext = createContext<VoiceChatContextProps | undefined>(undefined);

export interface VoiceChatProviderProps {
  children: ReactNode;
  systemPrompt?: string;
  voice?: "alloy" | "echo" | "fable" | "onyx" | "nova" | "shimmer";
  onClose?: () => void;
}

export function VoiceChatProvider({ 
  children,
  systemPrompt,
  voice = "alloy",
  onClose
}: VoiceChatProviderProps) {
  const { user } = useAuth();
  const [connectionAttempts, setConnectionAttempts] = useState(0);
  const maxConnectionAttempts = 3;

  // Set up audio playback manager
  const { audioRef, audioPlaybackManager } = useAudioPlaybackManager();

  // Load context before establishing connection
  const { contextLoaded, contextLoadError, loadContextWithTimeout } = useVoiceContextLoading(user?.id);

  // Show warning if user tries to connect without userId
  useEffect(() => {
    if (contextLoaded && !user?.id && !connectionAttempts) {
      console.warn("[VoiceChat] User is not logged in, continuing as guest");
      toast.warning("Connecting in guest mode. Log in for personalized experience.");
    }
  }, [contextLoaded, connectionAttempts, user?.id]);

  // Set up WebRTC connection with voice chat features
  const {
    isConnected,
    isConnecting,
    isMicrophoneActive,
    isAiSpeaking,
    isProcessingAudio,
    currentTranscript,
    transcriptProgress,
    connect,
    disconnect,
    handleMicrophoneToggle,
    getActiveMediaStream,
    sendTextMessage,
    handleConnectionError,
    handleSubmit
  } = useVoiceConnectionSetup({
    systemPrompt,
    voice,
    user,
    contextLoaded,
    contextLoadError,
    connectionAttempts,
    maxConnectionAttempts,
    setConnectionAttempts,
    audioPlaybackManager
  });

  // Extract microphone permission state
  const { microphonePermission } = useVoiceMicrophoneHandler({
    isConnected,
    isMicrophoneActive,
    commitAudioBuffer: () => true, // This is handled in the connection setup
    toggleMicrophone: handleMicrophoneToggle
  });
  
  // Set up side effects
  useVoiceChatEffects({
    isConnected,
    isAiSpeaking,
    currentTranscript,
    user,
    systemPrompt,
    disconnect
  });

  // Create the context value object
  const value: VoiceChatContextProps = {
    isConnected,
    isConnecting,
    isMicrophoneActive,
    isAiSpeaking,
    isProcessingAudio,
    currentTranscript,
    transcriptProgress,
    connectionAttempts,
    contextLoaded,
    contextLoadError,
    audioRef,
    audioPlaybackManager,
    connect,
    disconnect,
    handleMicrophoneToggle,
    getActiveMediaStream,
    sendTextMessage,
    handleSubmit,
    systemPrompt,
    voice,
    microphonePermission,
    user
  };

  return (
    <VoiceChatContext.Provider value={value}>
      {children}
    </VoiceChatContext.Provider>
  );
}
