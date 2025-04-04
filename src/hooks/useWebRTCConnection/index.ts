
import { useState, useRef, useCallback } from "react";
import { WebRTCMessage, UseWebRTCConnectionOptions, WebRTCConnectionResult } from "./types";
import { WebRTCConnector } from "@/utils/realtime/WebRTCConnector";
import { AudioProcessor } from "@/utils/realtime/AudioProcessor";
import { AudioRecorder } from "@/utils/realtime/audio/AudioRecorder";
import { WebRTCMessageHandler } from "@/utils/realtime/WebRTCMessageHandler";
import { useConnectionActions } from "./useConnectionActions";

// Main hook for using WebRTC connection
export function useWebRTCConnection(
  options: UseWebRTCConnectionOptions = {}
): WebRTCConnectionResult {
  const [isConnected, setIsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [isMicrophoneActive, setIsMicrophoneActive] = useState(false);
  const [isAiSpeaking, setIsAiSpeaking] = useState(false);
  const [isProcessingAudio, setIsProcessingAudio] = useState(false);
  const [currentTranscript, setCurrentTranscript] = useState("");
  const [transcriptProgress, setTranscriptProgress] = useState(0);
  const [messages, setMessages] = useState<WebRTCMessage[]>([]);

  // Refs for managing WebRTC connector, audio processor, and recorder
  const connectorRef = useRef<WebRTCConnector | null>(null);
  const audioProcessorRef = useRef<AudioProcessor | null>(null);
  const recorderRef = useRef<AudioRecorder | null>(null);

  // Initialize WebRTC message handler
  const messageHandlerRef = useRef<WebRTCMessageHandler>(new WebRTCMessageHandler({
    onTranscriptUpdate: (text) => {
      setCurrentTranscript(text);
    },
    onTranscriptComplete: () => {
      setTranscriptProgress(100);
    },
    onAudioData: (base64Audio) => {
      //console.log("Received audio data:", base64Audio);
    },
    onAudioComplete: () => {
      setIsAiSpeaking(false);
    },
    onMessageReceived: (message) => {
      setMessages((prevMessages) => [...prevMessages, message]);
    },
    onFinalTranscript: (transcript) => {
      setCurrentTranscript(transcript);
    },
    instructions: options.instructions,
    userId: options.userId
  }));

  // Function to handle incoming messages
  const handleMessage = useCallback((event: MessageEvent) => {
    messageHandlerRef.current.handleMessage(event);
  }, []);

  // Update message handler options when options change
  useCallback(() => {
    messageHandlerRef.current.updateOptions({
      instructions: options.instructions,
      userId: options.userId
    });
  }, [options.instructions, options.userId]);

  // Connection actions
  const {
    connect: innerConnect,
    disconnect,
    toggleMicrophone,
    sendTextMessage,
    commitAudioBuffer,
    getActiveMediaStream,
    getActiveAudioTrack,
    prewarmMicrophoneAccess,
    isMicrophoneReady,
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
    options,
    setIsConnected,
    setIsConnecting,
    setIsMicrophoneActive,
    setCurrentTranscript,
    setIsAiSpeaking,
    (message: WebRTCMessage) => {
      setMessages((prevMessages) => [...prevMessages, message]);
    }
  );

  // Properly wrap connect function with async/await
  const connect = async (): Promise<void> => {
    if (innerConnect) {
      await innerConnect();
    }
  };

  // Properly wrap toggleMicrophone function
  const wrappedToggleMicrophone = async (): Promise<void> => {
    if (toggleMicrophone) {
      await toggleMicrophone();
    }
  };

  // Return the WebRTCConnectionResult with the correct types
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
    toggleMicrophone: wrappedToggleMicrophone,
    sendTextMessage,
    commitAudioBuffer,
    getActiveMediaStream,
    getActiveAudioTrack,
    setAudioPlaybackManager
  };
}
