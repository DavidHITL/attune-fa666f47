
import React from "react";
import { useVoiceChatContext } from "@/hooks/useVoiceChatContext";
import ConnectionStatusAlerts from "./ConnectionStatusAlerts";
import VoiceChatAudio from "./VoiceChatAudio";
import MicrophoneControlGroup from "./MicrophoneControlGroup";
import TranscriptDisplay from "./TranscriptDisplay";
import ConnectionControls from "./ConnectionControls";
import MessageInput from "./MessageInput";
import KeyboardShortcutsHelp from "./KeyboardShortcutsHelp";

interface VoiceChatBodyProps {
  onClose?: () => void;
}

/**
 * Main UI component for the voice chat interface
 */
const VoiceChatBody: React.FC<VoiceChatBodyProps> = ({ onClose }) => {
  const {
    audioRef,
    getActiveMediaStream,
    isConnected,
    isConnecting,
    isMicrophoneActive,
    isAiSpeaking,
    isProcessingAudio,
    currentTranscript,
    transcriptProgress,
    disconnect,
    handleMicrophoneToggle,
    microphonePermission,
    handleSubmit
  } = useVoiceChatContext();

  return (
    <div className="flex flex-col space-y-4 w-full max-w-xl mx-auto p-4 bg-white rounded-lg shadow-md">
      {/* Connection status alerts */}
      <ConnectionStatusAlerts />
      
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
        isProcessingAudio={isProcessingAudio}
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

export default VoiceChatBody;
