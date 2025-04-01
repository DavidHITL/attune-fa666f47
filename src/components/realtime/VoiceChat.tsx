
import React, { useRef, useEffect } from "react";
import { useWebRTCConnection } from "@/hooks/useWebRTCConnection";
import { toast } from "sonner";
import { saveMessage } from "@/services/messages/messageStorage";
import { useAuth } from "@/context/AuthContext";
import ConnectionControls from "./ConnectionControls";
import TranscriptDisplay from "./TranscriptDisplay";
import MicrophoneStatus from "./MicrophoneStatus";
import MessageInput from "./MessageInput";
import { useVoiceMicrophoneHandler } from "@/hooks/useVoiceMicrophoneHandler";
import { useVoiceChatEffects } from "@/hooks/useVoiceChatEffects";

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
    getActiveMediaStream
  } = useWebRTCConnection({
    instructions: systemPrompt,
    voice,
    autoConnect: false,
    enableMicrophone: false,
    onTrack: (event) => {
      // Handle incoming audio track
      if (event.track.kind === 'audio' && event.streams && event.streams.length > 0) {
        console.log("[VoiceChat] Received audio track from WebRTC, connecting to audio element");
        if (audioRef.current) {
          audioRef.current.srcObject = event.streams[0];
          
          audioRef.current.onloadedmetadata = () => {
            console.log("[VoiceChat] Audio metadata loaded, attempting playback");
            audioRef.current?.play()
              .then(() => console.log("[VoiceChat] Audio playback started"))
              .catch(err => {
                console.error("[VoiceChat] Audio playback failed:", err);
                toast.error("Audio playback failed. Please check your audio settings.");
              });
          };
        }
      }
    }
  });

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
      // Save the text message to the database
      if (user) {
        try {
          await saveMessage(text, true, { 
            messageType: 'text',
            instructions: systemPrompt
          });
        } catch (error) {
          console.error("Failed to save text message:", error);
        }
      }
      
      // Send message via WebRTC
      sendTextMessage(text);
    } else {
      toast.error("Please connect to OpenAI first");
    }
  };

  // Ensure audio context is resumed after user interaction
  useEffect(() => {
    const handleUserInteraction = () => {
      if (audioRef.current && audioRef.current.paused) {
        console.log("[VoiceChat] User interaction detected, attempting to resume audio context");
        audioRef.current.play()
          .catch(err => console.log("[VoiceChat] Could not auto-play audio after interaction:", err));
      }
    };

    // Add interaction listeners
    document.addEventListener('click', handleUserInteraction);
    document.addEventListener('touchstart', handleUserInteraction);
    
    return () => {
      document.removeEventListener('click', handleUserInteraction);
      document.removeEventListener('touchstart', handleUserInteraction);
    };
  }, []);

  return (
    <div className="flex flex-col space-y-4 w-full max-w-xl mx-auto p-4 bg-white rounded-lg shadow-md">
      {/* Hidden audio element for playing assistant's voice */}
      <audio 
        ref={audioRef} 
        autoPlay 
        playsInline
        style={{ display: 'none' }}
        id="voice-chat-audio"
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
      {isMicrophoneActive && (
        <div className="text-xs text-gray-500 text-center mt-1">
          Press <span className="px-1 py-0.5 bg-gray-200 rounded">Space</span> or <span className="px-1 py-0.5 bg-gray-200 rounded">Esc</span> to stop recording
        </div>
      )}
    </div>
  );
};

export default VoiceChat;
