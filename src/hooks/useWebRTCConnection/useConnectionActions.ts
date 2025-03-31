
import { useCallback } from "react";
import { toast } from "sonner";
import { WebRTCConnector } from "@/utils/realtime/WebRTCConnector";
import { AudioRecorder } from "@/utils/realtime/AudioRecorder";
import { UseWebRTCConnectionOptions } from "./types";

export function useConnectionActions(
  isConnected: boolean,
  isConnecting: boolean,
  isMicrophoneActive: boolean,
  connectorRef: React.MutableRefObject<WebRTCConnector | null>,
  recorderRef: React.MutableRefObject<AudioRecorder | null>,
  audioProcessorRef: React.MutableRefObject<AudioProcessor | null>,
  handleMessage: (event: MessageEvent) => void,
  options: UseWebRTCConnectionOptions,
  setIsConnected: (isConnected: boolean) => void,
  setIsConnecting: (isConnecting: boolean) => void,
  setIsMicrophoneActive: (isMicrophoneActive: boolean) => void,
  setCurrentTranscript: (currentTranscript: string) => void,
  setIsAiSpeaking: (isAiSpeaking: boolean) => void,
  setMessages: (messages: any[]) => void
) {
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
  }, [isConnected, isMicrophoneActive, connectorRef, recorderRef]);

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
  }, [isConnected, connectorRef]);

  return {
    connect,
    disconnect,
    toggleMicrophone,
    sendTextMessage
  };
}
