
import { useCallback } from "react";
import { useConnectionBase } from "./useConnectionBase";
import { useConnectionStateChangeHandler } from "./useConnectionStateChangeHandler";
import { useConnectionErrorHandler } from "./useConnectionErrorHandler";
import { useMicrophoneToggle } from "./useMicrophoneToggle";
import { UseWebRTCConnectionOptions } from "./types";

export function useConnectionLifecycle(
  isConnected: boolean,
  isConnecting: boolean,
  connectorRef: React.MutableRefObject<any>,
  audioProcessorRef: React.MutableRefObject<any>,
  recorderRef: React.MutableRefObject<any>,
  handleMessage: (event: MessageEvent) => void,
  options: UseWebRTCConnectionOptions,
  setIsConnected: (isConnected: boolean) => void,
  setIsConnecting: (isConnecting: boolean) => void,
  setIsMicrophoneActive: (isMicrophoneActive: boolean) => void,
  setCurrentTranscript: (currentTranscript: string) => void,
  setIsAiSpeaking: (isAiSpeaking: boolean) => void,
  getActiveAudioTrack: () => MediaStreamTrack | null
) {
  // Enhanced disconnect function with proper cleanup sequence
  const disconnect = useCallback(() => {
    console.log("[useConnectionLifecycle] Starting disconnection sequence");
    
    // Stop microphone if active
    if (recorderRef.current) {
      console.log("[useConnectionLifecycle] Stopping microphone");
      recorderRef.current.stop();
      recorderRef.current = null;
      setIsMicrophoneActive(false);
    }
    
    // Disconnect WebRTC
    if (connectorRef.current) {
      console.log("[useConnectionLifecycle] Disconnecting WebRTC connector");
      connectorRef.current.disconnect();
      connectorRef.current = null;
    }
    
    // Reset state
    setIsConnected(false);
    setIsConnecting(false);
    setCurrentTranscript("");
    setIsAiSpeaking(false);
    
    // Clean up audio processor
    if (audioProcessorRef.current) {
      console.log("[useConnectionLifecycle] Cleaning up audio processor");
      audioProcessorRef.current.cleanup();
    }
    
    console.log("[useConnectionLifecycle] Disconnect complete");
  }, [setIsConnected, setIsConnecting, setCurrentTranscript, setIsAiSpeaking, setIsMicrophoneActive, audioProcessorRef, connectorRef, recorderRef]);

  // Use connection error handler
  const { handleConnectionError } = useConnectionErrorHandler(
    disconnect, 
    setIsConnecting
  );

  // Use microphone toggle hook
  const { toggleMicrophone } = useMicrophoneToggle(
    connectorRef,
    recorderRef,
    audioProcessorRef,
    isConnected,
    setIsMicrophoneActive,
    () => connectorRef.current?.commitAudioBuffer() || false
  );

  // Use connection state change handler
  const { handleConnectionStateChange } = useConnectionStateChangeHandler(
    isConnected,
    options,
    setIsConnected,
    setIsConnecting,
    disconnect,
    toggleMicrophone
  );

  // Use connection base hook for core functionality
  const { connect } = useConnectionBase(
    isConnected,
    isConnecting,
    connectorRef,
    audioProcessorRef,
    handleMessage,
    options,
    setIsConnecting,
    setCurrentTranscript,
    setIsAiSpeaking,
    getActiveAudioTrack
  );
  
  return {
    connect,
    disconnect,
    toggleMicrophone,
    handleConnectionStateChange,
    handleConnectionError
  };
}
