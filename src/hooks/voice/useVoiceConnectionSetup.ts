
import { useCallback } from "react";
import { useWebRTCConnection } from "../useWebRTCConnection";
import { User } from "@supabase/supabase-js";
import { useConnectionErrorHandler } from "./useConnectionErrorHandler";
import { AudioPlaybackManager } from "@/utils/realtime/audio/AudioPlaybackManager";

interface UseVoiceConnectionSetupProps {
  systemPrompt?: string;
  voice?: "alloy" | "echo" | "fable" | "onyx" | "nova" | "shimmer";
  user: User | null;
  contextLoaded: boolean;
  contextLoadError: string | null;
  connectionAttempts: number;
  maxConnectionAttempts: number;
  setConnectionAttempts: (value: React.SetStateAction<number>) => void;
  audioPlaybackManager: React.MutableRefObject<AudioPlaybackManager | null>;
}

/**
 * Hook to set up and manage WebRTC connection for voice chat
 */
export function useVoiceConnectionSetup({
  systemPrompt,
  voice = "alloy",
  user,
  contextLoaded,
  contextLoadError,
  connectionAttempts,
  maxConnectionAttempts,
  setConnectionAttempts,
  audioPlaybackManager
}: UseVoiceConnectionSetupProps) {
  // Set up WebRTC connection with enhanced options
  const {
    isConnected,
    isConnecting,
    isMicrophoneActive,
    isAiSpeaking,
    isProcessingAudio,
    currentTranscript,
    transcriptProgress,
    connect: rtcConnect,
    disconnect,
    toggleMicrophone,
    sendTextMessage,
    commitAudioBuffer,
    getActiveMediaStream,
    setAudioPlaybackManager
  } = useWebRTCConnection({
    instructions: systemPrompt || "You are a helpful, conversational AI assistant. Maintain context from previous text chats.", 
    voice,
    userId: user?.id, // Only pass userId if we have a logged in user
    autoConnect: contextLoaded && connectionAttempts === 0 && !contextLoadError, // Auto-connect only when context is ready
    enableMicrophone: false,
    onError: undefined // We'll set this after initializing the error handler
  });

  // Wrap connect method to properly handle async/await
  const connect = useCallback(async () => {
    try {
      await rtcConnect();
    } catch (error) {
      console.error("[VoiceConnectionSetup] Connection error:", error);
    }
  }, [rtcConnect]);

  // Use the connection error handler hook
  const { handleConnectionError } = useConnectionErrorHandler({
    userId: user?.id,
    connectionAttempts,
    maxConnectionAttempts,
    setConnectionAttempts,
    connect
  });

  // Connect the audio playback manager to the WebRTC connection
  useCallback(() => {
    if (audioPlaybackManager.current && setAudioPlaybackManager) {
      setAudioPlaybackManager(audioPlaybackManager.current);
    }
  }, [audioPlaybackManager, setAudioPlaybackManager]);

  // Wrap toggle microphone with async handling
  const handleMicrophoneToggle = useCallback(async () => {
    try {
      await toggleMicrophone();
      return true;
    } catch (error) {
      console.error("[VoiceConnectionSetup] Microphone toggle error:", error);
      return false;
    }
  }, [toggleMicrophone]);

  // Handle form submission for text input
  const handleSubmit = useCallback((text: string) => {
    if (!text.trim()) return;
    
    if (isConnected) {
      sendTextMessage(text);
    }
  }, [isConnected, sendTextMessage]);

  return {
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
    commitAudioBuffer,
    handleSubmit
  };
}
