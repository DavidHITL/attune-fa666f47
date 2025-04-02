
import { useEffect } from "react";
import { UseWebRTCConnectionOptions, WebRTCConnectionResult, WebRTCMessage } from "./types";
import { useConnectionState } from "./useConnectionState";
import { useMessageHandler } from "./useMessageHandler";
import { useConnectionActions } from "./useConnectionActions";
import { useAudioProcessor } from "./useAudioProcessor";
import { AudioProcessor } from "@/utils/realtime/AudioProcessor";
import { WebRTCMessageHandler } from "@/utils/realtime/WebRTCMessageHandler";
import { AudioPlaybackManager } from "@/utils/realtime/audio/AudioPlaybackManager";
import { toast } from "sonner";

// Re-export hooks and types for external use
export * from "./types";
export * from "./useConnectionState";
export * from "./useConnectionManagement";
export * from "./useConnectionLifecycle";
export * from "./useConnectionStateHandler";
export * from "./useConnectionErrorHandler";
export * from "./useDisconnection";
export * from "./useDataChannelStatus";

export function useWebRTCConnection(options: UseWebRTCConnectionOptions = {}): WebRTCConnectionResult {
  // Set default options
  const connectionOptions = {
    model: "gpt-4o-realtime-preview-2024-12-17",
    voice: "alloy" as const,
    instructions: "You are a helpful assistant. Be concise in your responses.",
    autoConnect: false,
    enableMicrophone: false,
    ...options
  };
  
  // Initialize state
  const {
    isConnected,
    isConnecting,
    isMicrophoneActive,
    isAiSpeaking,
    currentTranscript,
    messages,
    connectorRef,
    recorderRef,
    audioProcessorRef,
    messageHandlerRef,
    setIsConnected,
    setIsConnecting,
    setIsMicrophoneActive,
    setIsAiSpeaking,
    setCurrentTranscript,
    setMessages
  } = useConnectionState();
  
  // Initialize audio processor and message handler
  const { 
    audioProcessor,
    messageHandler,
    isProcessingAudio,
    transcriptProgress
  } = useAudioProcessor(setIsAiSpeaking, setCurrentTranscript);
  
  // Store references to the created instances
  useEffect(() => {
    if (audioProcessor) {
      audioProcessorRef.current = audioProcessor as AudioProcessor;
    }
    
    if (messageHandler) {
      messageHandlerRef.current = messageHandler as WebRTCMessageHandler;
    }
    
    return () => {
      if (audioProcessorRef.current) {
        audioProcessorRef.current.cleanup();
      }
    };
  }, [audioProcessor, messageHandler, audioProcessorRef, messageHandlerRef]);
  
  // Set up message handler
  const { handleMessage } = useMessageHandler(messageHandlerRef, setMessages);
  
  // Create a wrapper function to adapt setMessages to the expected signature
  const addMessage = (message: WebRTCMessage) => {
    setMessages(prev => [...prev, message]);
  };
  
  // Custom error handler function
  const handleError = (error: Error) => {
    console.error("[WebRTCConnection] Error:", error);
    toast.error(`WebRTC error: ${error.message || "Unknown error"}`);
    
    // Dispatch a custom error event that can be caught by components
    const errorEvent = new CustomEvent("webrtc-error", { 
      detail: { error } 
    });
    window.dispatchEvent(errorEvent);
  };
  
  // Set up connection actions
  const {
    connect,
    disconnect,
    toggleMicrophone,
    sendTextMessage,
    commitAudioBuffer,
    getActiveMediaStream,
    getActiveAudioTrack,
    isDataChannelReady,
    setAudioPlaybackManager
  } = useConnectionActions(
    isConnected,
    isConnecting,
    isMicrophoneActive,
    connectorRef,
    recorderRef,
    audioProcessorRef,
    handleMessage,
    connectionOptions,
    setIsConnected,
    setIsConnecting,
    setIsMicrophoneActive,
    setCurrentTranscript,
    setIsAiSpeaking,
    addMessage
  );
  
  // Auto-connect if enabled
  useEffect(() => {
    if (connectionOptions.autoConnect && !isConnected && !isConnecting) {
      connect().catch(handleError);
    }
    
    return () => {
      disconnect();
    };
  }, [connect, disconnect, isConnected, isConnecting, connectionOptions.autoConnect]);
  
  // Return the public API
  return {
    isConnected,
    isConnecting,
    isMicrophoneActive,
    isAiSpeaking,
    isProcessingAudio,
    currentTranscript,
    transcriptProgress,
    messages,
    isDataChannelReady,
    connect,
    disconnect,
    toggleMicrophone,
    sendTextMessage,
    commitAudioBuffer,
    getActiveMediaStream,
    getActiveAudioTrack,
    setAudioPlaybackManager
  };
}
