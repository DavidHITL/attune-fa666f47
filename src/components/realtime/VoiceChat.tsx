
import React, { useRef, useEffect, useState } from "react";
import { useWebRTCConnection } from "@/hooks/useWebRTCConnection";
import { useAuth } from "@/context/AuthContext";
import ConnectionControls from "./ConnectionControls";
import TranscriptDisplay from "./TranscriptDisplay";
import MicrophoneStatus from "./MicrophoneStatus";
import MessageInput from "./MessageInput";
import { useVoiceMicrophoneHandler } from "@/hooks/useVoiceMicrophoneHandler";
import { useVoiceChatEffects } from "@/hooks/useVoiceChatEffects";
import VoiceChatAudio from "./VoiceChatAudio";
import KeyboardShortcutsHelp from "./KeyboardShortcutsHelp";
import { AudioPlaybackManager } from "@/utils/realtime/audio/AudioPlaybackManager";
import MicrophoneControlGroup from "./MicrophoneControlGroup";
import { toast } from "sonner";
import { trackModeTransition, logContextVerification, getRecentContextSummary } from "@/services/context/unifiedContextProvider";
import { fetchUserContext } from "@/services/context";

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
          console.log("[VoiceChat] Preloading user context for voice mode");
          
          // Get context summary
          const contextSummary = await getRecentContextSummary(user.id);
          if (contextSummary) {
            console.log("[VoiceChat] Context summary:", contextSummary);
          }
          
          // Load full context
          const userContext = await fetchUserContext(user.id);
          if (userContext) {
            console.log("[VoiceChat] User context loaded successfully:", {
              messageCount: userContext.recentMessages?.length || 0,
              hasUserDetails: !!userContext.userDetails,
              analysisPresent: !!userContext.analysisResults
            });
            
            // Mark context as loaded
            setContextLoaded(true);
            
            // Show toast if we have previous context
            if (userContext.recentMessages && userContext.recentMessages.length > 0) {
              toast.success(`Loaded context from ${userContext.recentMessages.length} previous messages`);
            }
          }
        } catch (error) {
          console.error("[VoiceChat] Error preloading user context:", error);
        }
      }
    };
    
    preloadUserContext();
  }, [user?.id, contextLoaded]);

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
    userId: user?.id,
    autoConnect: contextLoaded, // Only auto-connect after context is loaded
    enableMicrophone: false,
    onTrack: null, // We'll handle this in VoiceChatAudio
  });

  // Log that we're entering voice mode when component mounts
  useEffect(() => {
    const initializeVoiceMode = async () => {
      if (user?.id) {
        console.log("[VoiceChat] Entering voice mode");
        
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

  // Extract microphone handling logic
  const {
    microphonePermission,
    handleMicrophoneToggle
  } = useVoiceMicrophoneHandler({
    isConnected,
    isMicrophoneActive,
    commitAudioBuffer,
    toggleMicrophone
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
