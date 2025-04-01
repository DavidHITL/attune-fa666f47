
import React, { useRef, useEffect } from "react";
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

interface VoiceChatProps {
  systemPrompt?: string;
  voice?: "alloy" | "echo" | "fable" | "onyx" | "nova" | "shimmer";
  onClose?: () => void;
}

const VoiceChat: React.FC<VoiceChatProps> = ({
  systemPrompt = "You are a helpful AI assistant. Be concise in your responses.",
  voice = "alloy",
  onClose
}) => {
  const { user } = useAuth();
  const audioRef = useRef<HTMLAudioElement>(null);
  const audioPlaybackManager = useRef<AudioPlaybackManager | null>(null);
  
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
    instructions: systemPrompt,
    voice,
    autoConnect: false,
    enableMicrophone: false,
    // Use the VoiceChatAudio component for handling audio tracks
    onTrack: null // We'll handle this in VoiceChatAudio
  });

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

  return (
    <div className="flex flex-col space-y-4 w-full max-w-xl mx-auto p-4 bg-white rounded-lg shadow-md">
      {/* Audio element handled by separate component */}
      <VoiceChatAudio 
        audioRef={audioRef} 
        getActiveMediaStream={getActiveMediaStream} 
      />
      
      {/* Connection Status & Controls */}
      <ConnectionControls 
        isConnected={isConnected}
        isConnecting={isConnecting}
        isMicrophoneActive={isMicrophoneActive}
        microphonePermission={microphonePermission}
        onConnect={connect}
        onDisconnect={disconnect}
        onToggleMicrophone={handleMicrophoneToggle}
      />
      
      {/* AI Transcript Display */}
      <TranscriptDisplay 
        isConnected={isConnected}
        isAiSpeaking={isAiSpeaking}
        isProcessingAudio={isProcessingAudio || false}
        currentTranscript={currentTranscript}
        transcriptProgress={transcriptProgress}
      />
      
      {/* Microphone Status Indicator */}
      <MicrophoneStatus isActive={isMicrophoneActive} />
      
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
