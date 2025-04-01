
import { useCallback } from "react";
import { UseWebRTCConnectionOptions, WebRTCMessage } from "../types";
import { WebRTCConnector } from "@/utils/realtime/WebRTCConnector";
import { AudioProcessor } from "@/utils/realtime/AudioProcessor";
import { AudioRecorder } from "@/utils/realtime/audio/AudioRecorder";
import { AudioPlaybackManager } from "@/utils/realtime/audio/AudioPlaybackManager";

/**
 * Hook to manage WebRTC connection establishment and disconnection
 */
export function useConnectionManager(
  isConnected: boolean,
  isConnecting: boolean,
  connectorRef: React.MutableRefObject<WebRTCConnector | null>,
  audioProcessorRef: React.MutableRefObject<AudioProcessor | null>,
  recorderRef: React.MutableRefObject<AudioRecorder | null>,
  handleMessage: (event: MessageEvent) => void,
  options: UseWebRTCConnectionOptions,
  setIsConnected: (isConnected: boolean) => void,
  setIsConnecting: (isConnecting: boolean) => void,
  setIsMicrophoneActive: (isMicrophoneActive: boolean) => void,
  setCurrentTranscript: (currentTranscript: string) => void,
  setIsAiSpeaking: (isAiSpeaking: boolean) => void,
  toggleMicrophone: () => Promise<boolean>,
  getActiveAudioTrack: () => MediaStreamTrack | null
) {
  // Connect to the OpenAI Realtime API
  const connect = useCallback(async () => {
    // Don't reconnect if already connected or connecting
    if (isConnected || isConnecting) {
      console.log("[useConnectionManager] Already connected or connecting");
      return true;
    }
    
    setIsConnecting(true);
    console.log("[useConnectionManager] Connecting to OpenAI Realtime API");
    
    try {
      // Create a new connector if one doesn't exist
      if (!connectorRef.current) {
        console.log("[useConnectionManager] Creating new WebRTCConnector");
        connectorRef.current = new WebRTCConnector(options);
      }
      
      // Get the active audio track if available for the connection
      const audioTrack = getActiveAudioTrack();
      
      // Connect to OpenAI Realtime API with optional audio track
      const success = await connectorRef.current.connect(audioTrack);
      
      if (success) {
        console.log("[useConnectionManager] Successfully connected to OpenAI Realtime API");
        return true;
      } else {
        console.error("[useConnectionManager] Failed to connect to OpenAI Realtime API");
        setIsConnecting(false);
        return false;
      }
    } catch (error) {
      console.error("[useConnectionManager] Error connecting to OpenAI Realtime API:", error);
      setIsConnecting(false);
      return false;
    }
  }, [isConnected, isConnecting, connectorRef, options, setIsConnecting, getActiveAudioTrack]);

  // Set the audio playback manager in the WebRTC connector
  const setAudioPlaybackManager = useCallback((audioManager: AudioPlaybackManager) => {
    if (connectorRef.current) {
      console.log("[useConnectionManager] Setting AudioPlaybackManager in WebRTCConnector");
      connectorRef.current.setAudioPlaybackManager(audioManager);
    }
  }, [connectorRef]);

  // Disconnect from the OpenAI Realtime API
  const disconnect = useCallback(() => {
    if (isConnected) {
      console.log("[useConnectionManager] Disconnecting from OpenAI Realtime API");
    }
    
    // Stop microphone if active
    if (recorderRef.current) {
      console.log("[useConnectionManager] Stopping microphone");
      recorderRef.current.stop();
      recorderRef.current = null;
    }
    
    // Stop audio processor if active
    if (audioProcessorRef.current) {
      console.log("[useConnectionManager] Stopping audio processor");
      audioProcessorRef.current.stop();
      audioProcessorRef.current = null;
    }
    
    // Disconnect from OpenAI if connected
    if (connectorRef.current) {
      console.log("[useConnectionManager] Disconnecting WebRTCConnector");
      connectorRef.current.disconnect();
      connectorRef.current = null;
    }
    
    // Reset state
    setIsConnected(false);
    setIsConnecting(false);
    setIsMicrophoneActive(false);
    setCurrentTranscript("");
    setIsAiSpeaking(false);
  }, [
    isConnected, 
    connectorRef, 
    recorderRef, 
    audioProcessorRef, 
    setIsConnected, 
    setIsConnecting, 
    setIsMicrophoneActive, 
    setCurrentTranscript, 
    setIsAiSpeaking
  ]);

  return {
    connect,
    disconnect,
    setAudioPlaybackManager
  };
}
