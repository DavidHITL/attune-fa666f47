import { useState, useRef, useCallback } from "react";
import { 
  UseWebRTCConnectionOptions, 
  WebRTCConnectionState 
} from "./types";
import { WebRTCOptions } from "@/utils/realtime/WebRTCTypes";
import { ConnectionManager } from "@/utils/realtime/ConnectionManager";
import { AudioProcessor } from "@/utils/realtime/AudioProcessor";
import { WebRTCMessageHandler } from "@/utils/realtime/WebRTCMessageHandler";
import { AudioRecorder } from "@/utils/realtime/AudioRecorder";
import { SessionManager } from "@/utils/realtime/connector/SessionManager";
import { AudioPlaybackManager } from "@/utils/realtime/audio/AudioPlaybackManager";

interface UseConnectionActions {
  isConnected: boolean;
  isConnecting: boolean;
  isMicrophoneActive: boolean;
  connectorRef: React.MutableRefObject<ConnectionManager | null>;
  recorderRef: React.MutableRefObject<AudioRecorder | null>;
  audioProcessorRef: React.MutableRefObject<AudioProcessor | null>;
  messageHandlerRef: React.MutableRefObject<WebRTCMessageHandler | null>;
  handleMessage: (message: any) => void;
  options: UseWebRTCConnectionOptions;
  setIsConnected: React.Dispatch<React.SetStateAction<boolean>>;
  setIsConnecting: React.Dispatch<React.SetStateAction<boolean>>;
  setIsMicrophoneActive: React.Dispatch<React.SetStateAction<boolean>>;
  setCurrentTranscript: React.Dispatch<React.SetStateAction<string>>;
  setIsAiSpeaking: React.Dispatch<React.SetStateAction<boolean>>;
  addMessage: (message: any) => void;
}

export const useConnectionActions = (
  isConnected: boolean,
  isConnecting: boolean,
  isMicrophoneActive: boolean,
  connectorRef: React.MutableRefObject<ConnectionManager | null>,
  recorderRef: React.MutableRefObject<AudioRecorder | null>,
  audioProcessorRef: React.MutableRefObject<AudioProcessor | null>,
  messageHandlerRef: React.MutableRefObject<WebRTCMessageHandler | null>,
  handleMessage: (message: any) => void,
  options: UseWebRTCConnectionOptions,
  setIsConnected: React.Dispatch<React.SetStateAction<boolean>>,
  setIsConnecting: React.Dispatch<React.SetStateAction<boolean>>,
  setIsMicrophoneActive: React.Dispatch<React.SetStateAction<boolean>>,
  setCurrentTranscript: React.Dispatch<React.SetStateAction<string>>,
  setIsAiSpeaking: React.Dispatch<React.SetStateAction<boolean>>,
  addMessage: (message: any) => void
) => {
  const [dataChannelReady, setDataChannelReady] = useState(false);
  const activeStreamRef = useRef<MediaStream | null>(null);
  const sessionManagerRef = useRef<SessionManager | null>(null);
  const audioPlaybackManagerRef = useRef<AudioPlaybackManager | null>(null);
  
  const connect = useCallback(async () => {
    if (isConnected || isConnecting) {
      console.log("[useConnectionActions] Already connecting/connected, ignoring connect call");
      return;
    }
    
    setIsConnecting(true);
    setIsConnected(false);
    setDataChannelReady(false);
    
    const { 
      model, 
      voice, 
      instructions, 
      userId, 
      onError 
    } = options;
    
    const webrtcOptions: WebRTCOptions = {
      model: model || "gpt-4o-realtime-preview-2024-12-17",
      voice: voice || "alloy",
      instructions: instructions || "You are a helpful assistant. Be concise in your responses.",
      userId: userId,
      onError: onError
    };
    
    try {
      // Initialize connection manager
      const connector = new ConnectionManager();
      connectorRef.current = connector;
      
      // Set up connection lifecycle events
      connector.onOpen(() => {
        console.log("[useConnectionActions] Connection opened");
        setIsConnecting(false);
        setIsConnected(true);
      });
      
      connector.onClose(() => {
        console.log("[useConnectionActions] Connection closed");
        setIsConnecting(false);
        setIsConnected(false);
        setDataChannelReady(false);
        activeStreamRef.current = null;
        
        // Reset session configuration status
        sessionManagerRef.current?.resetSessionConfigured();
      });
      
      connector.onError((error: any) => {
        console.error("[useConnectionActions] Connection error:", error);
        setIsConnecting(false);
        setIsConnected(false);
        setDataChannelReady(false);
        activeStreamRef.current = null;
        
        // Reset session configuration status
        sessionManagerRef.current?.resetSessionConfigured();
      });
      
      connector.onMessage((message: any) => {
        handleMessage(message);
      });
      
      // Initialize audio recorder
      const recorder = new AudioRecorder();
      recorderRef.current = recorder;
      
      // Initialize session manager
      sessionManagerRef.current = new SessionManager(
        connector.pc, 
        connector.dc, 
        webrtcOptions,
        audioPlaybackManagerRef.current || undefined
      );
      
      // Configure data channel
      connector.dc.onopen = () => {
        console.log("[useConnectionActions] Data channel opened");
        setDataChannelReady(true);
        
        // Configure session if ready
        sessionManagerRef.current?.configureSessionIfReady();
      };
      
      connector.dc.onclose = () => {
        console.log("[useConnectionActions] Data channel closed");
        setDataChannelReady(false);
        
        // Reset session configuration status
        sessionManagerRef.current?.resetSessionConfigured();
      };
      
      // Start connecting
      const connected = await connector.connect();
      
      if (connected) {
        console.log("[useConnectionActions] Successfully initiated connection");
      } else {
        console.warn("[useConnectionActions] Failed to initiate connection");
        setIsConnecting(false);
        setIsConnected(false);
        setDataChannelReady(false);
      }
    } catch (error: any) {
      console.error("[useConnectionActions] Error during connection setup:", error);
      setIsConnecting(false);
      setIsConnected(false);
      setDataChannelReady(false);
      
      // Reset session configuration status
      sessionManagerRef.current?.resetSessionConfigured();
      
      // Pass the error up to the parent component
      options.onError?.(error);
    }
  }, [
    isConnected,
    isConnecting,
    options,
    setIsConnected,
    setIsConnecting,
    handleMessage
  ]);
  
  const disconnect = useCallback(() => {
    console.log("[useConnectionActions] Disconnecting");
    
    // Stop the audio stream if it's active
    if (activeStreamRef.current) {
      activeStreamRef.current.getTracks().forEach(track => track.stop());
      activeStreamRef.current = null;
    }
    
    // Stop audio processing
    audioProcessorRef.current?.stop();
    
    // Disconnect from the server
    connectorRef.current?.disconnect();
    setIsConnecting(false);
    setIsConnected(false);
    setIsMicrophoneActive(false);
    setDataChannelReady(false);
    
    // Reset session configuration status
    sessionManagerRef.current?.resetSessionConfigured();
  }, [
    setIsConnected,
    setIsConnecting,
    setIsMicrophoneActive,
    connectorRef,
    audioProcessorRef
  ]);
  
  const toggleMicrophone = useCallback(async () => {
    if (!isConnected || !recorderRef.current || !audioProcessorRef.current) {
      console.warn("[useConnectionActions] Not connected or recorder/processor not initialized");
      return;
    }
    
    try {
      if (!isMicrophoneActive) {
        console.log("[useConnectionActions] Starting microphone");
        
        // Start audio processing
        audioProcessorRef.current.start();
        
        // Get the audio stream
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        activeStreamRef.current = stream;
        
        // Get the active audio track
        const audioTrack = stream.getAudioTracks()[0];
        
        // Start recording the audio
        recorderRef.current.start(audioTrack);
        
        // Set microphone as active
        setIsMicrophoneActive(true);
      } else {
        console.log("[useConnectionActions] Stopping microphone");
        
        // Stop audio processing
        audioProcessorRef.current?.stop();
        
        // Stop the audio stream
        if (activeStreamRef.current) {
          activeStreamRef.current.getTracks().forEach(track => track.stop());
          activeStreamRef.current = null;
        }
        
        // Stop recording
        recorderRef.current.stop();
        
        // Set microphone as inactive
        setIsMicrophoneActive(false);
      }
    } catch (error: any) {
      console.error("[useConnectionActions] Error toggling microphone:", error);
      setIsMicrophoneActive(false);
      options.onError?.(error);
    }
  }, [
    isConnected,
    isMicrophoneActive,
    setIsMicrophoneActive,
    options
  ]);
  
  const sendTextMessage = useCallback((text: string) => {
    if (!isConnected || !connectorRef.current) {
      console.warn("[useConnectionActions] Not connected, cannot send text message");
      return;
    }
    
    // Send the text message through the connection manager
    connectorRef.current.send(JSON.stringify({
      event_id: `event_${Date.now()}`,
      type: "message.user",
      message: {
        type: "text",
        text: text
      }
    }));
  }, [isConnected, connectorRef]);
  
  const commitAudioBuffer = useCallback((audioData: Float32Array) => {
    if (!isConnected || !connectorRef.current) {
      console.warn("[useConnectionActions] Not connected, cannot commit audio buffer");
      return;
    }
    
    // Convert audio data to PCM16 format
    const pcm16Data = audioProcessorRef.current?.convertToPCM16(audioData);
    
    if (!pcm16Data) {
      console.warn("[useConnectionActions] Could not convert audio data to PCM16");
      return;
    }
    
    // Send the audio data through the connection manager
    connectorRef.current.send(pcm16Data);
  }, [isConnected, connectorRef, audioProcessorRef]);
  
  const getActiveMediaStream = useCallback(() => {
    return activeStreamRef.current;
  }, []);
  
  const getActiveAudioTrack = useCallback(() => {
    return activeStreamRef.current?.getAudioTracks()[0];
  }, []);
  
  const setAudioPlaybackManager = useCallback((manager: AudioPlaybackManager) => {
    audioPlaybackManagerRef.current = manager;
    
    // Set the audio playback manager on the session manager
    sessionManagerRef.current?.setAudioPlaybackManager(manager);
  }, []);
  
  return {
    connect,
    disconnect,
    toggleMicrophone,
    sendTextMessage,
    commitAudioBuffer,
    getActiveMediaStream,
    getActiveAudioTrack,
    isDataChannelReady: dataChannelReady,
    setAudioPlaybackManager
  };
};
