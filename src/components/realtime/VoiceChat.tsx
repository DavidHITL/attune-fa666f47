
import React, { useState, useEffect } from "react";
import { useWebRTCConnection } from "@/hooks/useWebRTCConnection";
import { toast } from "sonner";
import { saveMessage } from "@/services/messages/messageStorage";
import { useAuth } from "@/context/AuthContext";
import ConnectionControls from "./ConnectionControls";
import TranscriptDisplay from "./TranscriptDisplay";
import MicrophoneStatus from "./MicrophoneStatus";
import MessageInput from "./MessageInput";

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
  const [microphonePermission, setMicrophonePermission] = useState<PermissionState | null>(null);
  const { user } = useAuth();
  
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
    commitAudioBuffer
  } = useWebRTCConnection({
    instructions: systemPrompt,
    voice,
    autoConnect: false,
    enableMicrophone: false
  });

  // Check microphone permissions
  useEffect(() => {
    const checkMicrophonePermission = async () => {
      try {
        const permissionStatus = await navigator.permissions.query({ name: 'microphone' as PermissionName });
        setMicrophonePermission(permissionStatus.state);
        
        // Listen for permission changes
        permissionStatus.addEventListener('change', () => {
          setMicrophonePermission(permissionStatus.state);
        });
        
        return () => {
          permissionStatus.removeEventListener('change', () => {});
        };
      } catch (error) {
        console.error("Error checking microphone permission:", error);
        // If we can't check permissions, assume we need to ask
        setMicrophonePermission(null);
      }
    };
    
    checkMicrophonePermission();
  }, []);

  // Handle microphone button click with permission checking
  const handleMicrophoneToggle = async (): Promise<boolean> => {
    // If already active, just toggle off
    if (isMicrophoneActive) {
      // When turning off the mic, make sure to commit the audio buffer
      // to signal the end of the utterance
      if (isConnected) {
        commitAudioBuffer();
      }
      const success = await toggleMicrophone();
      return success;
    }
    
    // If permission is denied, show helpful message
    if (microphonePermission === 'denied') {
      toast.error("Microphone access is blocked. Please update your browser settings.");
      return false;
    }
    
    // Otherwise try to activate
    const success = await toggleMicrophone();
    
    if (!success && microphonePermission !== 'granted' && microphonePermission !== 'prompt') {
      // If failed but not explicitly denied, might be a technical issue
      toast.error("Could not access microphone. Please check your device settings.");
    }
    
    return success;
  };

  // Listen for keypress events to stop recording
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (isMicrophoneActive && (e.key === ' ' || e.key === 'Escape')) {
        // If space bar or escape is pressed while mic is active, stop recording
        if (isConnected) {
          console.log("Key pressed to stop recording, committing audio buffer");
          commitAudioBuffer();
          setTimeout(() => {
            toggleMicrophone().catch(console.error);
          }, 100);
        }
      }
    };
    
    window.addEventListener('keyup', handleKeyPress);
    return () => window.removeEventListener('keyup', handleKeyPress);
  }, [isMicrophoneActive, isConnected, toggleMicrophone, commitAudioBuffer]);

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

  // Save transcript when AI finishes speaking
  useEffect(() => {
    const saveTranscript = async () => {
      if (!isAiSpeaking && currentTranscript && user) {
        try {
          await saveMessage(currentTranscript, false, { 
            messageType: 'voice',
            instructions: systemPrompt
          });
          console.log("AI transcript saved to database");
        } catch (error) {
          console.error("Failed to save AI transcript:", error);
        }
      }
    };
    
    saveTranscript();
  }, [isAiSpeaking, currentTranscript, user, systemPrompt]);

  // Handle component unmount
  useEffect(() => {
    return () => {
      disconnect();
    };
  }, [disconnect]);

  return (
    <div className="flex flex-col space-y-4 w-full max-w-xl mx-auto p-4 bg-white rounded-lg shadow-md">
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
