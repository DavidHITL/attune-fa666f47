
import React, { useEffect } from 'react';
import VoiceStatusIndicator from './VoiceStatusIndicator';
import MicrophoneControlGroup from './MicrophoneControlGroup';
import ConnectionLoadingIndicator from './ConnectionLoadingIndicator';
import { useSilenceDetectorSetup } from './useSilenceDetectorSetup';
import { useConnectionHandlers } from './useConnectionHandlers';
import { useMicrophoneHandlers } from './useMicrophoneHandlers';

interface RealtimeChatProps {
  sessionStarted?: boolean;
  sessionEndTime?: number | null;
  onClose?: () => void;
  autoConnect?: boolean;
}

const RealtimeChat: React.FC<RealtimeChatProps> = ({
  sessionStarted = false,
  sessionEndTime = null,
  onClose,
  autoConnect = true // Default changed to true
}) => {
  // Set up connection handlers
  const {
    isConnected,
    isConnecting,
    connectVoiceChat,
    disconnectVoiceChat,
    autoConnect: shouldAutoConnect
  } = useConnectionHandlers({ autoConnect });
  
  // Set up silence detection
  const { silenceDetectorRef, silenceTimeoutRef } = useSilenceDetectorSetup({
    handleSilenceDetected: () => {} // This will be set later
  });
  
  // Set up microphone handlers
  const {
    isMicrophoneActive,
    isAiSpeaking,
    handleMicrophoneToggle,
    handleSilenceDetected,
    processAudioData
  } = useMicrophoneHandlers({
    isConnected,
    silenceTimeoutRef,
    silenceDetectorRef
  });
  
  // Update silence detector callback
  useEffect(() => {
    if (silenceDetectorRef.current) {
      silenceDetectorRef.current.setOnSilenceDetected(handleSilenceDetected);
    }
  }, [handleSilenceDetected]);
  
  // Connect immediately when component mounts
  useEffect(() => {
    console.log("RealtimeChat mounted, autoConnect:", shouldAutoConnect);
    if (shouldAutoConnect) {
      console.log("Auto-connect triggered for voice chat");
      connectVoiceChat().then(success => {
        console.log("Voice chat connection attempt result:", success);
        
        // Automatically activate microphone after successful connection
        if (success && !isMicrophoneActive) {
          console.log("Auto-activating microphone");
          handleMicrophoneToggle();
        }
      });
    }
  }, [shouldAutoConnect, connectVoiceChat, isMicrophoneActive, handleMicrophoneToggle]);
  
  // Cleanup on unmount
  useEffect(() => {
    return () => {
      console.log("RealtimeChat component unmounting, cleaning up");
      disconnectVoiceChat();
      
      // Clear any pending timeouts
      if (silenceTimeoutRef.current) {
        clearTimeout(silenceTimeoutRef.current);
        silenceTimeoutRef.current = null;
      }
    };
  }, [disconnectVoiceChat]);
  
  return (
    <div className="flex flex-col gap-4">
      {/* Voice Status Indicator */}
      <VoiceStatusIndicator 
        isAiSpeaking={isAiSpeaking}
        isMicrophoneActive={isMicrophoneActive}
        isConnecting={isConnecting}
        isConnected={isConnected}
      />
      
      {/* Microphone Controls */}
      <MicrophoneControlGroup
        isConnected={isConnected}
        isConnecting={isConnecting}
        isMicrophoneActive={isMicrophoneActive}
        isAiSpeaking={isAiSpeaking}
        onToggleMicrophone={handleMicrophoneToggle}
        onClose={onClose}
      />
      
      {/* Connection Loading Indicator */}
      <ConnectionLoadingIndicator isConnecting={isConnecting} />
    </div>
  );
};

export default RealtimeChat;
