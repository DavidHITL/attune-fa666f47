import React, { useRef, useEffect, useState, useCallback } from "react";
import { useWebRTCConnection } from "@/hooks/useWebRTCConnection";
import { useAuth } from "@/context/AuthContext";
import ConnectionControls from "./ConnectionControls";
import TranscriptDisplay from "./TranscriptDisplay";
import MessageInput from "./MessageInput";
import { useVoiceMicrophoneHandler } from "@/hooks/useVoiceMicrophoneHandler";
import { useVoiceChatEffects } from "@/hooks/useVoiceChatEffects";
import VoiceChatAudio from "./VoiceChatAudio";
import KeyboardShortcutsHelp from "./KeyboardShortcutsHelp";
import { AudioPlaybackManager } from "@/utils/realtime/audio/AudioPlaybackManager";
import MicrophoneControlGroup from "./MicrophoneControlGroup";
import { toast } from "sonner";
import { 
  trackModeTransition, 
  logContextVerification, 
  getRecentContextSummary 
} from "@/services/context/unifiedContextProvider";
import { fetchUserContext } from "@/services/context";
import { doesAnalysisExist } from "@/services/context/analysisService";

interface VoiceChatProps {
  systemPrompt?: string;
  voice?: "alloy" | "echo" | "fable" | "onyx" | "nova" | "shimmer";
  onClose?: () => void;
}

const VoiceChat: React.FC<VoiceChatProps> = ({
  systemPrompt,
  voice = "alloy",
  onClose
}) => {
  const { user } = useAuth();
  const audioRef = useRef<HTMLAudioElement>(null);
  const audioPlaybackManager = useRef<AudioPlaybackManager | null>(null);
  const [contextLoaded, setContextLoaded] = useState(false);
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

  // Pre-load user context before connection
  useEffect(() => {
    const preloadUserContext = async () => {
      if (user?.id && !contextLoaded) {
        try {
          console.log(`[VoiceChat] Preloading user context for voice mode with userId: ${user.id}`);
          
          // Get context summary
          const contextSummary = await getRecentContextSummary(user.id);
          if (contextSummary) {
            console.log("[VoiceChat] Context summary:", contextSummary);
          }
          
          // Check if user has analysis results
          const hasAnalysis = await doesAnalysisExist(user.id);
          console.log("[VoiceChat] User has analysis results:", hasAnalysis);
          
          // Load full context
          const userContext = await fetchUserContext(user.id);
          if (userContext) {
            console.log("[VoiceChat] User context loaded successfully:", {
              messageCount: userContext.recentMessages?.length || 0,
              hasUserDetails: !!userContext.userDetails,
              analysisPresent: !!userContext.analysisResults,
              knowledgeEntries: userContext.knowledgeEntries?.length || 0
            });
            
            // Mark context as loaded
            setContextLoaded(true);
            
            // Show toast if we have previous context
            if (userContext.recentMessages && userContext.recentMessages.length > 0) {
              toast.success(`Loaded context from ${userContext.recentMessages.length} previous messages`);
            }
          } else {
            // If no context was loaded, still mark as loaded to proceed
            console.log("[VoiceChat] No user context available, proceeding anyway");
            setContextLoaded(true);
          }
        } catch (error) {
          console.error("[VoiceChat] Error preloading user context:", error);
          // Even on error, mark as loaded to allow the user to continue
          setContextLoaded(true);
        }
      } else if (!user?.id) {
        // No user, but still mark as loaded to proceed
        console.log("[VoiceChat] No user ID available, proceeding without context");
        setContextLoaded(true);
      }
    };
    
    preloadUserContext();
  }, [user?.id, contextLoaded]);

  // Handle reconnection attempts
  const handleConnectionError = useCallback(() => {
    if (connectionAttempts < maxConnectionAttempts) {
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
    connect,
    disconnect,
    toggleMicrophone,
    sendTextMessage,
    commitAudioBuffer,
    getActiveMediaStream,
    setAudioPlaybackManager
  } = useWebRTCConnection({
    instructions: systemPrompt || "You are a helpful, conversational AI assistant. Maintain context from previous text chats.", 
    voice,
    userId: user?.id, // Ensure userId is properly passed
    autoConnect: contextLoaded && connectionAttempts === 0, // Only auto-connect after context is loaded and on first attempt
    enableMicrophone: false,
    onError: handleConnectionError
  });

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
          connectionInitiated: new Date().toISOString()
        });
      } else {
        console.log("[VoiceChat] No user ID available for voice mode");
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
  }, [user?.id, systemPrompt, currentTranscript, contextLoaded]);

  // Connect the audio playback manager to the WebRTC connection
  useEffect(() => {
    if (audioPlaybackManager.current && setAudioPlaybackManager) {
      setAudioPlaybackManager(audioPlaybackManager.current);
    }
  }, [setAudioPlaybackManager]);

  // Extract microphone handling logic - fix the signature mismatches
  const {
    microphonePermission,
    handleMicrophoneToggle
  } = useVoiceMicrophoneHandler({
    isConnected,
    isMicrophoneActive,
    // Fix: Provide a no-op function with the correct signature for commitAudioBuffer
    commitAudioBuffer: () => {
      commitAudioBuffer();
      return true; // Return true to match expected boolean return type
    },
    // Fix: Update toggleMicrophone to return a Promise<boolean>
    toggleMicrophone: async () => {
      await toggleMicrophone();
      return true; // Return true to match expected boolean return type
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
  const handleSubmit = async (text: string) => {
    if (!text.trim()) return;
    
    if (isConnected) {
      sendTextMessage(text);
    }
  };

  // Setup error handling for WebRTC errors
  useEffect(() => {
    // Add global error handler for WebRTC errors
    const handleWebRTCError = (event: CustomEvent) => {
      console.error("[VoiceChat] WebRTC error:", event.detail.error);
      
      // Show more helpful error message
      if (event.detail.error.message?.includes("configuration timed out")) {
        toast.error("Connection timed out. Please try again.");
      } else if (event.detail.error.message?.includes("closed unexpectedly")) {
        toast.error("Connection was closed unexpectedly. Please try again.");
      } else {
        toast.error(`Connection error: ${event.detail.error.message || "Unknown error"}`);
      }
    };

    // Add event listener for custom WebRTC errors
    window.addEventListener("webrtc-error", handleWebRTCError as EventListener);

    return () => {
      window.removeEventListener("webrtc-error", handleWebRTCError as EventListener);
    };
  }, []);

  return (
    <div className="flex flex-col space-y-4 w-full max-w-xl mx-auto p-4 bg-white rounded-lg shadow-md">
      {/* Loading indicator while context is loading */}
      {!contextLoaded && user?.id && (
        <div className="flex justify-center items-center py-2">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500"></div>
          <span className="ml-2 text-sm text-gray-600">Loading conversation context...</span>
        </div>
      )}
      
      {/* Audio element handled by separate component */}
      <VoiceChatAudio 
        audioRef={audioRef} 
        getActiveMediaStream={getActiveMediaStream} 
      />
      
      {/* Microphone Control Group - includes status and controls */}
      <MicrophoneControlGroup 
        isConnected={isConnected}
        isConnecting={isConnecting}
        isMicrophoneActive={isMicrophoneActive}
        isAiSpeaking={isAiSpeaking}
        onToggleMicrophone={handleMicrophoneToggle}
        onClose={onClose}
      />
      
      {/* AI Transcript Display */}
      <TranscriptDisplay 
        isConnected={isConnected}
        isAiSpeaking={isAiSpeaking}
        isProcessingAudio={isProcessingAudio || false}
        currentTranscript={currentTranscript}
        transcriptProgress={transcriptProgress}
      />
      
      {/* Connection Controls (now just for ending call) */}
      <ConnectionControls 
        isConnected={isConnected}
        isConnecting={isConnecting}
        isMicrophoneActive={isMicrophoneActive}
        microphonePermission={microphonePermission}
        isAiSpeaking={isAiSpeaking}
        onDisconnect={disconnect}
        onToggleMicrophone={handleMicrophoneToggle}
        onClose={onClose}
      />
      
      {/* Text Input */}
      <MessageInput 
        isConnected={isConnected} 
        onSubmit={handleSubmit} 
      />
      
      {/* Helper text for keyboard controls */}
      {isMicrophoneActive && <KeyboardShortcutsHelp />}
    </div>
  );
};

export default VoiceChat;
