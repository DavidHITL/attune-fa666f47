
import { useCallback } from "react";
import { AudioPlaybackManager } from "@/utils/realtime/audio/AudioPlaybackManager";
import { useConnectionActions } from "./useConnectionActions";
import { useDisconnection } from "./useDisconnection";

/**
 * Hook to manage WebRTC connection lifecycle
 */
export function useConnectionManager(
  isConnected: boolean,
  isConnecting: boolean,
  connectorRef: React.MutableRefObject<any>,
  audioProcessorRef: React.MutableRefObject<any>,
  recorderRef: React.MutableRefObject<any>,
  handleMessage: (event: MessageEvent) => void,
  options: any,
  setIsConnected: (isConnected: boolean) => void,
  setIsConnecting: (isConnecting: boolean) => void,
  setIsMicrophoneActive: (isMicrophoneActive: boolean) => void,
  setCurrentTranscript: (currentTranscript: string) => void,
  setIsAiSpeaking: (isAiSpeaking: boolean) => void,
  toggleMicrophone: () => Promise<boolean>,
  getActiveAudioTrack: () => MediaStreamTrack | null
) {
  // Get connection action functions
  const { connect: connectAction, sendTextMessage, commitAudioBuffer } = useConnectionActions(
    isConnected,
    isConnecting,
    connectorRef,
    audioProcessorRef,
    options,
    setIsConnecting,
    handleMessage,
    (error) => handleConnectionError(error),
    (state) => handleConnectionStateChange(state),
    getActiveAudioTrack
  );

  // Get disconnect function
  const { disconnect } = useDisconnection(
    connectorRef,
    recorderRef,
    audioProcessorRef,
    setIsConnected,
    setIsConnecting,
    setIsMicrophoneActive,
    setCurrentTranscript,
    setIsAiSpeaking
  );

  // Handle connection state changes
  const handleConnectionStateChange = useCallback((state: RTCPeerConnectionState) => {
    console.log("[useConnectionManager] Connection state changed:", state);
    
    if (state === 'connected') {
      setIsConnected(true);
      setIsConnecting(false);
      
      // Auto-enable microphone if specified in options
      if (options.enableMicrophone) {
        setTimeout(() => {
          toggleMicrophone().catch(console.error);
        }, 1000);
      }
    } else if (['disconnected', 'failed', 'closed'].includes(state)) {
      setIsConnected(false);
    }
  }, [setIsConnected, setIsConnecting, options.enableMicrophone, toggleMicrophone]);

  // Handle connection errors
  const handleConnectionError = useCallback((error: any) => {
    console.error("[useConnectionManager] Connection error:", error);
    setIsConnecting(false);
  }, [setIsConnecting]);

  // Wrap connect function with async/await
  const connect = useCallback(async (): Promise<void> => {
    if (connectAction) {
      await connectAction();
    }
  }, [connectAction]);

  // Set audio playback manager
  const setAudioPlaybackManager = useCallback((manager: AudioPlaybackManager): void => {
    if (connectorRef.current) {
      console.log("[useConnectionManager] Setting AudioPlaybackManager");
      connectorRef.current.setAudioPlaybackManager(manager);
    }
  }, [connectorRef]);

  return {
    connect,
    disconnect,
    sendTextMessage,
    commitAudioBuffer,
    setAudioPlaybackManager
  };
}
