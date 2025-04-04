
import { createContext, useContext, ReactNode, useState, useEffect, useCallback, useRef } from "react";
import { useWebRTCConnection } from "./useWebRTCConnection";
import { useAuth } from "@/context/AuthContext";
import { useVoiceMicrophoneHandler } from "@/hooks/useVoiceMicrophoneHandler";
import { useVoiceChatEffects } from "./voice/useVoiceChatEffects";
import { useContextLoader } from "./voice/useContextLoader";
import { useConnectionErrorHandler } from "./voice/useConnectionErrorHandler";
import { AudioPlaybackManager } from "@/utils/realtime/audio/AudioPlaybackManager";
import { toast } from "sonner";
import { VoiceChatContextProps } from "./voice/types";

const VoiceChatContext = createContext<VoiceChatContextProps | undefined>(undefined);

export function VoiceChatProvider({ 
  children,
  systemPrompt,
  voice = "alloy",
  onClose
}: { 
  children: ReactNode;
  systemPrompt?: string;
  voice?: "alloy" | "echo" | "fable" | "onyx" | "nova" | "shimmer";
  onClose?: () => void;
}) {
  const { user } = useAuth();
  const audioRef = useRef<HTMLAudioElement>(null);
  const audioPlaybackManager = useRef<AudioPlaybackManager | null>(null);
  const [connectionAttempts, setConnectionAttempts] = useState(0);
  const maxConnectionAttempts = 3;

  // Use the context loader hook
  const {
    contextLoaded,
    contextLoadError,
    loadContextWithTimeout
  } = useContextLoader(user?.id);

  // Initialize audio playback manager
  useEffect(() => {
    if (!audioPlaybackManager.current) {
      audioPlaybackManager.current = new AudioPlaybackManager();
      console.log("[VoiceChat] AudioPlaybackManager initialized");
    }
    
    return () => {
      if (audioPlaybackManager.current) {
        audioPlaybackManager.current.cleanup();
        audioPlaybackManager.current = null;
      }
    };
  }, []);

  // Pre-load user context before connection
  useEffect(() => {
    if (!contextLoaded) {
      loadContextWithTimeout();
    }
  }, [contextLoaded, loadContextWithTimeout]);

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
      console.error("[VoiceChatContext] Connection error:", error);
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

  // Set the error handler for WebRTC connection
  useEffect(() => {
    if (handleConnectionError) {
      // This is a conceptual demonstration - in a real implementation,
      // we would need to modify useWebRTCConnection to accept a dynamic onError handler
      console.log("[VoiceChatContext] Setting error handler for WebRTC connection");
    }
  }, [handleConnectionError]);

  // Show warning if user tries to connect without userId
  useEffect(() => {
    if (contextLoaded && !user?.id && !connectionAttempts) {
      console.warn("[VoiceChat] User is not logged in, continuing as guest");
      toast.warning("Connecting in guest mode. Log in for personalized experience.");
    }
  }, [contextLoaded, connectionAttempts, user?.id]);

  // Connect the audio playback manager to the WebRTC connection
  useEffect(() => {
    if (audioPlaybackManager.current && setAudioPlaybackManager) {
      setAudioPlaybackManager(audioPlaybackManager.current);
    }
  }, [setAudioPlaybackManager]);

  // Extract microphone handling logic
  const {
    microphonePermission,
    handleMicrophoneToggle
  } = useVoiceMicrophoneHandler({
    isConnected,
    isMicrophoneActive,
    commitAudioBuffer: () => {
      commitAudioBuffer();
      return true; 
    },
    toggleMicrophone: async () => {
      await toggleMicrophone();
      return true;
    }
  });
  
  // Extract side effects using the dedicated hook
  useVoiceChatEffects({
    isConnected,
    isAiSpeaking,
    currentTranscript,
    user,
    systemPrompt,
    disconnect
  });

  // Handle form submission for text input
  const handleSubmit = useCallback((text: string) => {
    if (!text.trim()) return;
    
    if (isConnected) {
      sendTextMessage(text);
    }
  }, [isConnected, sendTextMessage]);

  const value = {
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

export function useVoiceChatContext() {
  const context = useContext(VoiceChatContext);
  if (context === undefined) {
    throw new Error("useVoiceChatContext must be used within a VoiceChatProvider");
  }
  return context;
}
