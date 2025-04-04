
// Export the useConnectionActions function so it can be imported elsewhere
import { useState, useCallback, useRef, useEffect } from 'react';
import { useConnectionActions } from './useConnectionActions';
import { WebRTCConnector } from "@/utils/realtime/WebRTCConnector";
import { AudioRecorder } from "@/utils/realtime/audio/AudioRecorder";
import { AudioProcessor } from "@/utils/realtime/AudioProcessor";
import { WebRTCMessageHandler } from "@/utils/realtime/WebRTCMessageHandler";
import { WebRTCMessage, UseWebRTCConnectionOptions } from "./types";

export function useConnectionManagement(options: UseWebRTCConnectionOptions = {}) {
  // Connection state
  const [isConnected, setIsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [isMicrophoneActive, setIsMicrophoneActive] = useState(false);
  const [isAiSpeaking, setIsAiSpeaking] = useState(false);
  const [currentTranscript, setCurrentTranscript] = useState("");
  const [connectionAttempts, setConnectionAttempts] = useState(0);
  const [lastError, setLastError] = useState<Error | null>(null);

  // Technical refs
  const connectorRef = useRef<WebRTCConnector | null>(null);
  const audioProcessorRef = useRef<AudioProcessor | null>(null);
  const recorderRef = useRef<AudioRecorder | null>(null);

  // WebRTC message handler
  const messageHandlerRef = useRef<WebRTCMessageHandler>(new WebRTCMessageHandler({
    onTranscriptUpdate: (text) => setCurrentTranscript(text),
    onTranscriptComplete: () => console.log("Transcript complete"),
    onAudioData: (base64Audio) => console.log("Audio data received"),
    onAudioComplete: () => setIsAiSpeaking(false),
    onMessageReceived: (message) => console.log("Message received:", message),
    onFinalTranscript: (transcript) => console.log("Final transcript:", transcript),
    instructions: options.instructions,
    userId: options.userId
  }));

  // Connection life cycle tracker
  useEffect(() => {
    return () => {
      // Clean up on unmount
      console.log("[useConnectionManagement] [Lifecycle] Component unmounting, cleaning up connections");
      if (connectorRef.current) {
        connectorRef.current.disconnect();
        connectorRef.current = null;
      }
    };
  }, []);

  // Message handler
  const handleMessage = useCallback((event: MessageEvent) => {
    try {
      console.log("[useConnectionManagement] [DataChannel] Received WebRTC message");
      messageHandlerRef.current.handleMessage(event);
    } catch (error) {
      console.error("[useConnectionManagement] [DataChannel] [ERROR] Error handling WebRTC message:", error);
    }
  }, []);

  // Error handler
  const handleConnectionError = useCallback((error: any) => {
    console.error("[useConnectionManagement] [ConnectionError] WebRTC connection error:", error);
    console.error("[useConnectionManagement] [ConnectionError] Stack trace:", error instanceof Error ? error.stack : "No stack trace available");
    
    setLastError(error instanceof Error ? error : new Error(String(error)));
    setConnectionAttempts(prev => prev + 1);
    
    // Update UI state
    setIsConnecting(false);
  }, []);

  // Connection state change handler
  const handleConnectionStateChange = useCallback((state: RTCPeerConnectionState) => {
    console.log(`[useConnectionManagement] [ConnectionState] WebRTC connection state changed: ${state}`);
    
    switch (state) {
      case 'connected':
        setIsConnected(true);
        setIsConnecting(false);
        console.log("[useConnectionManagement] [ConnectionState] WebRTC connection established successfully");
        break;
      case 'disconnected':
      case 'failed':
      case 'closed':
        setIsConnected(false);
        setIsConnecting(false);
        console.warn(`[useConnectionManagement] [ConnectionState] WebRTC connection ${state}`);
        break;
      case 'connecting':
        setIsConnecting(true);
        break;
      default:
        break;
    }
  }, []);

  // Fixed the actions call to match the expected number of arguments
  const actions = useConnectionActions(
    isConnected,
    isConnecting,
    connectorRef,
    audioProcessorRef,
    recorderRef,
    options,
    setIsConnecting,
    handleMessage,
    handleConnectionError
  );

  // Debug logging for context and config
  useEffect(() => {
    const logConnectionConfig = () => {
      console.log("[useConnectionManagement] [Config] Connection configuration:", {
        autoConnect: options.autoConnect ?? false,
        enableMicrophone: options.enableMicrophone ?? false,
        model: options.model ?? "gpt-4o-realtime-preview-2024-12-17",
        hasUserId: !!options.userId,
        userId: options.userId ? `${options.userId.substring(0, 8)}...` : "none",
        voice: options.voice ?? "alloy"
      });
    };

    logConnectionConfig();
  }, [options]);

  // Auto-connect if specified
  useEffect(() => {
    if (options.autoConnect && !isConnected && !isConnecting && connectionAttempts === 0) {
      console.log("[useConnectionManagement] [AutoConnect] Auto-connecting to WebRTC...");
      
      // Fix the connect function call to use async/await properly
      const connectAsync = async () => {
        try {
          if (actions && actions.connect && typeof actions.connect === 'function') {
            await actions.connect();
          }
        } catch (error) {
          console.error("[useConnectionManagement] [AutoConnect] [ERROR] Auto-connect failed:", error);
        }
      };
      
      connectAsync();
    }
  }, [options.autoConnect, isConnected, isConnecting, connectionAttempts, actions]);

  return {
    ...actions,
    isConnected,
    isConnecting,
    isMicrophoneActive,
    isAiSpeaking,
    currentTranscript,
    lastError,
    connectionAttempts
  };
}

export { useConnectionActions } from './useConnectionActions';
