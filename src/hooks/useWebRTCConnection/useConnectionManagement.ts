
import { useCallback } from "react";
import { toast } from "sonner";
import { WebRTCConnector } from "@/utils/realtime/WebRTCConnector";
import { UseWebRTCConnectionOptions, WebRTCMessage } from "./types";
import { AudioProcessor } from "@/utils/realtime/AudioProcessor";

export function useConnectionManagement(
  isConnected: boolean,
  isConnecting: boolean,
  connectorRef: React.MutableRefObject<WebRTCConnector | null>,
  audioProcessorRef: React.MutableRefObject<AudioProcessor | null>,
  recorderRef: React.MutableRefObject<any>,
  handleMessage: (event: MessageEvent) => void,
  options: UseWebRTCConnectionOptions,
  setIsConnected: (isConnected: boolean) => void,
  setIsConnecting: (isConnecting: boolean) => void,
  setIsMicrophoneActive: (isMicrophoneActive: boolean) => void,
  setCurrentTranscript: (currentTranscript: string) => void,
  setIsAiSpeaking: (isAiSpeaking: boolean) => void,
  toggleMicrophone: () => Promise<boolean>
) {
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
    
    // Clean up audio processor
    if (audioProcessorRef.current) {
      audioProcessorRef.current.cleanup();
    }
  }, [setIsConnected, setCurrentTranscript, setIsAiSpeaking, setIsMicrophoneActive]);

  // Connect to OpenAI Realtime API
  const connect = useCallback(async () => {
    if (isConnected || isConnecting) return false;
    
    try {
      setIsConnecting(true);
      
      console.log("[useConnectionManagement] Starting connection process");
      
      // Create a new WebRTC connector
      const connector = new WebRTCConnector({
        ...options,
        onMessage: handleMessage,
        onConnectionStateChange: (state) => {
          console.log("[useConnectionManagement] Connection state changed:", state);
          setIsConnected(state === "connected");
          if (state === "failed" || state === "disconnected") {
            toast.error("WebRTC connection lost. Please reconnect.");
            disconnect();
          }
        },
        onError: (error) => {
          console.error("[useConnectionManagement] WebRTC error:", error);
          toast.error(`WebRTC error: ${error.message}`);
        }
      });
      
      connectorRef.current = connector;
      
      // Attempt to connect
      console.log("[useConnectionManagement] Calling connector.connect()");
      const success = await connector.connect();
      
      console.log("[useConnectionManagement] Connection result:", success ? "Success" : "Failed");
      
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
      console.error("[useConnectionManagement] Connection error:", error);
      toast.error(`Connection error: ${error instanceof Error ? error.message : String(error)}`);
      setIsConnecting(false);
      return false;
    }
  }, [handleMessage, isConnected, isConnecting, options, disconnect, setIsConnected, setIsConnecting, toggleMicrophone]);

  return {
    connect,
    disconnect
  };
}
