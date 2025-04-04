import { createContext, useContext, ReactNode, useState, useEffect, useCallback } from "react";
import { useWebRTCConnection } from "./useWebRTCConnection";
import { useAuth } from "@/context/AuthContext";
import { useVoiceMicrophoneHandler } from "@/hooks/useVoiceMicrophoneHandler";
import { useVoiceChatEffects } from "@/hooks/useVoiceChatEffects";
import { AudioPlaybackManager } from "@/utils/realtime/audio/AudioPlaybackManager";
import { toast } from "sonner";
import { 
  trackModeTransition, 
  logContextVerification, 
  getRecentContextSummary 
} from "@/services/context/unifiedContextProvider";
import { fetchUserContext } from "@/services/context";
import { doesAnalysisExist } from "@/services/context/analysisService";

interface VoiceChatContextProps {
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
  user: any;
}

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
  const audioRef = React.useRef<HTMLAudioElement>(null);
  const audioPlaybackManager = React.useRef<AudioPlaybackManager | null>(null);
  const [contextLoaded, setContextLoaded] = useState(false);
  const [contextLoadError, setContextLoadError] = useState<string | null>(null);
  const [connectionAttempts, setConnectionAttempts] = useState(0);
  const maxConnectionAttempts = 3;

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

  // Ensure we continue even if context loading fails after timeout
  const loadContextWithTimeout = useCallback(async () => {
    if (!user?.id) {
      console.log("[VoiceChat] No user ID available, proceeding as guest");
      setContextLoaded(true);
      return;
    }
    
    try {
      // Create a timeout promise to ensure we don't block forever
      const timeoutPromise = new Promise<void>((resolve) => {
        setTimeout(() => {
          console.warn("[VoiceChat] Context loading timed out, proceeding anyway");
          setContextLoadError("Context loading timed out");
          resolve();
        }, 5000); // 5 second timeout
      });
      
      // Create the actual context loading promise
      const loadPromise = async () => {
        try {
          console.log(`[VoiceChat] Preloading user context with userId: ${user.id}`);
          
          // Get context summary first (fast operation)
          const contextSummary = await getRecentContextSummary(user.id);
          if (contextSummary) {
            console.log("[VoiceChat] Context summary:", contextSummary);
          }
          
          // Check if user has analysis results (fast operation)
          const hasAnalysis = await doesAnalysisExist(user.id);
          console.log("[VoiceChat] User has analysis results:", hasAnalysis);
          
          // Load full context (potentially slower)
          const userContext = await fetchUserContext(user.id);
          if (userContext) {
            console.log("[VoiceChat] User context loaded successfully:", {
              messageCount: userContext.recentMessages?.length || 0,
              hasUserDetails: !!userContext.userDetails,
              analysisPresent: !!userContext.analysisResults,
              knowledgeEntries: userContext.knowledgeEntries?.length || 0
            });
            
            // Show toast if we have previous context
            if (userContext.recentMessages && userContext.recentMessages.length > 0) {
              toast.success(`Loaded context from ${userContext.recentMessages.length} previous messages`);
            }
          } else {
            console.log("[VoiceChat] No user context available");
            setContextLoadError("No context available for user");
          }
        } catch (error) {
          console.error("[VoiceChat] Error loading context:", error);
          setContextLoadError(error instanceof Error ? error.message : "Unknown error loading context");
          throw error;
        }
      };
      
      // Race between timeout and loading
      await Promise.race([loadPromise(), timeoutPromise]);
      
      // Mark context as loaded regardless of outcome
      // This ensures we can proceed even with partial or no context
      setContextLoaded(true);
    } catch (error) {
      // Final fallback - proceed even if everything fails
      console.error("[VoiceChat] Critical error in context loading:", error);
      setContextLoaded(true); 
      setContextLoadError("Failed to load user context");
    }
  }, [user?.id]);

  // Pre-load user context before connection
  useEffect(() => {
    if (!contextLoaded) {
      loadContextWithTimeout();
    }
  }, [contextLoaded, loadContextWithTimeout]);

  // Handle reconnection attempts
  const handleConnectionError = useCallback((error: any) => {
    const errorMessage = error instanceof Error ? error.message : String(error);
    
    // Check for userId related errors
    if (errorMessage.includes("userId") || errorMessage.includes("context")) {
      toast.error("Connection error: Unable to load user context");
      console.error("[VoiceChat] Context-related error:", errorMessage);
    } 
    // Handle other connection errors
    else if (connectionAttempts < maxConnectionAttempts) {
      const newAttemptCount = connectionAttempts + 1;
      setConnectionAttempts(newAttemptCount);
      toast.warning(`Connection failed. Attempting to reconnect (${newAttemptCount}/${maxConnectionAttempts})...`);
      
      // Wait a moment before reconnecting
      setTimeout(() => {
        if (connect) connect().catch(console.error);
      }, 1500);
    } else {
      toast.error("Connection failed after multiple attempts. Please try again later.");
    }
  }, [connectionAttempts, maxConnectionAttempts]);

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
    onError: handleConnectionError
  });

  // Wrap connect method to properly handle async/await
  const connect = useCallback(async () => {
    try {
      await rtcConnect();
    } catch (error) {
      console.error("[VoiceChatContext] Connection error:", error);
    }
  }, [rtcConnect]);

  // Show warning if user tries to connect without userId
  useEffect(() => {
    if (contextLoaded && !user?.id && !connectionAttempts) {
      console.warn("[VoiceChat] User is not logged in, continuing as guest");
      toast.warning("Connecting in guest mode. Log in for personalized experience.");
    }
  }, [contextLoaded, connectionAttempts, user?.id]);

  // Log that we're entering voice mode when component mounts
  useEffect(() => {
    const initializeVoiceMode = async () => {
      if (user?.id) {
        console.log(`[VoiceChat] Entering voice mode for user: ${user.id}`);
        
        // Track mode transition (text -> voice)
        await trackModeTransition('text', 'voice', user.id);
        
        // Log context verification
        await logContextVerification({
          userId: user.id,
          activeMode: 'voice',
          sessionStarted: true
        }, systemPrompt, {
          contextLoaded,
          connectionInitiated: new Date().toISOString(),
          contextLoadError: contextLoadError || undefined
        });
      } else {
        console.log("[VoiceChat] No user ID available for voice mode - using guest mode");
      }
    };
    
    if (contextLoaded) {
      initializeVoiceMode();
    }
    
    return () => {
      if (user?.id) {
        console.log("[VoiceChat] Exiting voice mode");
        // Track transition back to text mode when unmounting
        trackModeTransition('voice', 'text', user.id, currentTranscript).catch(console.error);
      }
    };
  }, [user?.id, systemPrompt, currentTranscript, contextLoaded, contextLoadError]);

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
  
  // Extract side effects
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
