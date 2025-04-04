
import { useState, useRef } from "react";
import { UseWebRTCConnectionOptions, WebRTCConnectionResult } from "./types";
import { useConnectionState } from "./useConnectionState";
import { useMessageHandler } from "./useMessageHandler";
import { useConnectionManager } from "./useConnectionManager";
import { useMicrophoneControl } from "./useMicrophoneControl";
import { useMediaStreamManager } from "./useMediaStreamManager";
import { useDataChannelStatus } from "./useDataChannelStatus";

/**
 * Main hook for using WebRTC connection to OpenAI Realtime API
 */
export function useWebRTCConnection(
  options: UseWebRTCConnectionOptions = {}
): WebRTCConnectionResult {
  // State for message and transcript tracking
  const [messages, setMessages] = useState([]);
  const [transcriptProgress, setTranscriptProgress] = useState(0);
  const [isProcessingAudio, setIsProcessingAudio] = useState(false);
  
  // Get base connection state and refs
  const {
    isConnected,
    isConnecting,
    isMicrophoneActive,
    isAiSpeaking,
    currentTranscript,
    connectorRef,
    recorderRef,
    audioProcessorRef,
    messageHandlerRef,
    setIsConnected,
    setIsConnecting,
    setIsMicrophoneActive,
    setIsAiSpeaking,
    setCurrentTranscript
  } = useConnectionState();

  // Use media stream manager
  const { 
    getActiveMediaStream,
    getActiveAudioTrack 
  } = useMediaStreamManager();

  // Set up message handler
  const { handleMessage } = useMessageHandler(
    messageHandlerRef, 
    setMessages,
    setCurrentTranscript,
    setTranscriptProgress,
    setIsAiSpeaking,
    options
  );

  // Set up microphone control
  const { 
    toggleMicrophone,
    commitAudioBuffer 
  } = useMicrophoneControl(
    isConnected,
    isMicrophoneActive,
    connectorRef,
    recorderRef,
    setIsMicrophoneActive
  );

  // Set up connection manager with the correct return type
  const { 
    connect,
    disconnect,
    sendTextMessage,
    setAudioPlaybackManager
  } = useConnectionManager(
    isConnected,
    isConnecting,
    connectorRef,
    audioProcessorRef,
    recorderRef,
    handleMessage,
    options,
    setIsConnected,
    setIsConnecting,
    setIsMicrophoneActive,
    setCurrentTranscript,
    setIsAiSpeaking,
    toggleMicrophone,
    getActiveAudioTrack
  );

  // Track data channel status
  const { isDataChannelReady } = useDataChannelStatus(isConnected, connectorRef);

  // Return the complete WebRTCConnection result
  return {
    // State
    isConnected,
    isConnecting,
    isMicrophoneActive,
    isAiSpeaking,
    isProcessingAudio,
    currentTranscript,
    transcriptProgress,
    messages,
    isDataChannelReady,
    
    // Actions
    connect,
    disconnect,
    toggleMicrophone,
    sendTextMessage,
    commitAudioBuffer,
    
    // Utilities
    getActiveMediaStream,
    getActiveAudioTrack,
    setAudioPlaybackManager
  };
}

// Re-export necessary types and utilities
export { useConnectionActions } from './useConnectionActions';
export { useConnectionManagement } from './useConnectionManagement';
