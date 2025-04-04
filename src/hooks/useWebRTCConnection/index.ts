
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
  const audioTrackRef = useRef<MediaStreamTrack | null>(null);

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
  const updateMessageHandler = useCallback(() => {
    messageHandlerRef.current.updateOptions({
      instructions: options.instructions,
      userId: options.userId
    });
  }, [options.instructions, options.userId]);

  // Call updateMessageHandler when options change
  useCallback(() => {
    updateMessageHandler();
  }, [updateMessageHandler]);

  // Modified to match the correct function signature in useConnectionActions
  const connectionActions = useConnectionActions(
    isConnected,
    isConnecting,
    connectorRef,
    audioTrackRef,
    options,
    setIsConnecting,
    handleMessage,
    (error: any) => {
      console.error("[useWebRTCConnection] Connection error:", error);
    },
    (state: RTCPeerConnectionState) => {
      console.log("[useWebRTCConnection] Connection state changed:", state);
      if (state === 'connected') {
        setIsConnected(true);
      } else if (['disconnected', 'failed', 'closed'].includes(state)) {
        setIsConnected(false);
      }
    }
  );

  // Extract actions from connectionActions
  const { connect, sendTextMessage, commitAudioBuffer } = connectionActions;

  // Properly wrap connect function with async/await
  const connectAsync = useCallback(async (): Promise<void> => {
    if (connect) {
      await connect();
    }
  }, [connect]);

  // Return a simplified set of actions that matches our interface
  return {
    isConnected,
    isConnecting,
    isMicrophoneActive,
    isAiSpeaking,
    isProcessingAudio,
    currentTranscript,
    transcriptProgress,
    messages,
    connect: connectAsync,
    disconnect: () => {}, // Placeholder to match interface
    toggleMicrophone: async () => {}, // Placeholder to match interface
    sendTextMessage,
    commitAudioBuffer,
    isDataChannelReady: false // Placeholder to match interface
  };
}
