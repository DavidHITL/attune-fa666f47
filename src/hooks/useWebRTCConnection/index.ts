
import { useEffect } from "react";
import { UseWebRTCConnectionOptions, WebRTCConnectionResult } from "./types";
import { useConnectionState } from "./useConnectionState";
import { useAudioProcessor } from "./useAudioProcessor";
import { useMessageHandler } from "./useMessageHandler";
import { useConnectionActions } from "./useConnectionActions";
import { AudioProcessor } from "@/utils/realtime/AudioProcessor";
import { WebRTCMessageHandler } from "@/utils/realtime/WebRTCMessageHandler";

export * from "./types";

export function useWebRTCConnection(options: UseWebRTCConnectionOptions = {}): WebRTCConnectionResult {
  // Set default options
  const connectionOptions = {
    model: "gpt-4o-realtime-preview-2024-12-17",
    voice: "alloy",
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
  useEffect(() => {
    audioProcessorRef.current = new AudioProcessor();
    
    // Initialize message handler
    messageHandlerRef.current = new WebRTCMessageHandler({
      onAudioData: (base64Audio) => {
        if (audioProcessorRef.current) {
          audioProcessorRef.current.addAudioData(base64Audio);
          setIsAiSpeaking(true);
        }
      },
      onAudioComplete: () => {
        setIsAiSpeaking(false);
      },
      onTranscriptUpdate: (textDelta) => {
        setCurrentTranscript(prev => prev + textDelta);
      },
      onTranscriptComplete: () => {
        setTimeout(() => setCurrentTranscript(""), 1000);
      }
    });

    return () => {
      if (audioProcessorRef.current) {
        audioProcessorRef.current.cleanup();
      }
    };
  }, []);
  
  // Set up message handler
  const { handleMessage } = useMessageHandler(messageHandlerRef, setMessages);
  
  // Set up connection actions
  const {
    connect,
    disconnect,
    toggleMicrophone,
    sendTextMessage
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
    setMessages
  );
  
  // Auto-connect if enabled
  useEffect(() => {
    if (connectionOptions.autoConnect && !isConnected && !isConnecting) {
      connect();
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
    currentTranscript,
    messages,
    connect,
    disconnect,
    toggleMicrophone,
    sendTextMessage
  };
}
