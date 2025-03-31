
import { useState, useEffect, useCallback, useRef } from "react";
import { WebRTCConnector } from "@/utils/realtime/WebRTCConnector";
import { WebRTCOptions } from "@/utils/realtime/WebRTCTypes";
import { AudioRecorder } from "@/utils/realtime/AudioRecorder";
import { AudioProcessor } from "@/utils/realtime/AudioProcessor";
import { WebRTCMessageHandler } from "@/utils/realtime/WebRTCMessageHandler";
import { toast } from "sonner";

export interface UseWebRTCConnectionOptions extends WebRTCOptions {
  autoConnect?: boolean;
  enableMicrophone?: boolean;
}

export interface WebRTCMessage {
  type: string;
  [key: string]: any;
}

export function useWebRTCConnection(options: UseWebRTCConnectionOptions = {}) {
  const [isConnected, setIsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [isMicrophoneActive, setIsMicrophoneActive] = useState(false);
  const [messages, setMessages] = useState<WebRTCMessage[]>([]);
  const [currentTranscript, setCurrentTranscript] = useState("");
  const [isAiSpeaking, setIsAiSpeaking] = useState(false);
  
  const connectorRef = useRef<WebRTCConnector | null>(null);
  const recorderRef = useRef<AudioRecorder | null>(null);
  const audioProcessorRef = useRef<AudioProcessor | null>(null);
  const messageHandlerRef = useRef<WebRTCMessageHandler | null>(null);

  // Initialize audio processor
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

  // Handle incoming WebRTC messages
  const handleMessage = useCallback((event: MessageEvent) => {
    try {
      const message = JSON.parse(event.data);
      
      // Add to messages for debugging/display
      setMessages(prev => [...prev, message]);
      
      // Use the message handler to process the message
      if (messageHandlerRef.current) {
        messageHandlerRef.current.handleMessage(event);
      }
    } catch (error) {
      console.error("[useWebRTCConnection] Error handling message:", error);
    }
  }, []);

  // Connect to OpenAI Realtime API
  const connect = useCallback(async () => {
    if (isConnected || isConnecting) return false;
    
    try {
      setIsConnecting(true);
      
      // Create a new WebRTC connector
      const connector = new WebRTCConnector({
        ...options,
        onMessage: handleMessage,
        onConnectionStateChange: (state) => {
          setIsConnected(state === "connected");
          if (state === "failed" || state === "disconnected") {
            toast.error("WebRTC connection lost. Please reconnect.");
            disconnect();
          }
        },
        onError: (error) => {
          toast.error(`WebRTC error: ${error.message}`);
        }
      });
      
      connectorRef.current = connector;
      
      // Attempt to connect
      const success = await connector.connect();
      
      if (success) {
        setIsConnected(true);
        toast.success("Connected to OpenAI Realtime API");
        
        // Start microphone if enabled
        if (options.enableMicrophone) {
          await toggleMicrophone();
        }
      } else {
        toast.error("Failed to connect to OpenAI Realtime API");
        connectorRef.current = null;
      }
      
      setIsConnecting(false);
      return success;
    } catch (error) {
      console.error("[useWebRTCConnection] Connection error:", error);
      toast.error(`Connection error: ${error instanceof Error ? error.message : String(error)}`);
      setIsConnecting(false);
      return false;
    }
  }, [handleMessage, isConnected, isConnecting, options]);

  // Disconnect from OpenAI Realtime API
  const disconnect = useCallback(() => {
    // Stop microphone if active
    if (recorderRef.current) {
      recorderRef.current.stop();
      recorderRef.current = null;
      setIsMicrophoneActive(false);
    }
    
    // Disconnect WebRTC
    if (connectorRef.current) {
      connectorRef.current.disconnect();
      connectorRef.current = null;
    }
    
    // Reset state
    setIsConnected(false);
    setCurrentTranscript("");
    setIsAiSpeaking(false);
    setMessages([]);
    
    // Clean up audio processor
    if (audioProcessorRef.current) {
      audioProcessorRef.current.cleanup();
    }
  }, []);

  // Toggle microphone on/off
  const toggleMicrophone = useCallback(async () => {
    if (!isConnected || !connectorRef.current) {
      toast.error("Please connect to OpenAI first");
      return false;
    }
    
    if (isMicrophoneActive && recorderRef.current) {
      // Stop recording
      recorderRef.current.stop();
      recorderRef.current = null;
      setIsMicrophoneActive(false);
      return true;
    } else {
      // Start recording
      try {
        const recorder = new AudioRecorder({
          onAudioData: (audioData) => {
            // Send audio data if connection is active
            if (connectorRef.current) {
              connectorRef.current.sendAudioData(audioData);
            }
          }
        });
        
        const success = await recorder.start();
        
        if (success) {
          recorderRef.current = recorder;
          setIsMicrophoneActive(true);
          return true;
        } else {
          toast.error("Failed to start microphone");
          return false;
        }
      } catch (error) {
        console.error("[useWebRTCConnection] Microphone error:", error);
        toast.error(`Microphone error: ${error instanceof Error ? error.message : String(error)}`);
        return false;
      }
    }
  }, [isConnected, isMicrophoneActive]);

  // Send text message to OpenAI
  const sendTextMessage = useCallback((text: string) => {
    if (!isConnected || !connectorRef.current) {
      toast.error("Please connect to OpenAI first");
      return false;
    }
    
    try {
      return connectorRef.current.sendTextMessage(text);
    } catch (error) {
      console.error("[useWebRTCConnection] Error sending message:", error);
      toast.error(`Error sending message: ${error instanceof Error ? error.message : String(error)}`);
      return false;
    }
  }, [isConnected]);

  // Auto-connect if enabled
  useEffect(() => {
    if (options.autoConnect && !isConnected && !isConnecting) {
      connect();
    }
    
    return () => {
      disconnect();
    };
  }, [connect, disconnect, isConnected, isConnecting, options.autoConnect]);

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
