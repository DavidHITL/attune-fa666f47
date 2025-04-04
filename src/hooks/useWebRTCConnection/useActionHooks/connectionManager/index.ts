
import { useConnectionDisconnection } from "./useConnectionDisconnection";
import { useConnectionSetup } from "./useConnectionSetup";
import { useAudioPlaybackManager } from "./useAudioPlaybackManager";
import { useTrackEventHandler } from "./useTrackEventHandler";
import { AudioPlaybackManager } from "@/utils/realtime/audio/AudioPlaybackManager";
import { WebRTCConnector } from "@/utils/realtime/WebRTCConnector";
import { UseWebRTCConnectionOptions } from "../../types";
import { useCallback, useRef } from "react";

export function useConnectionManager(
  isConnected: boolean,
  isConnecting: boolean,
  connectorRef: React.MutableRefObject<WebRTCConnector | null>,
  audioProcessorRef: React.MutableRefObject<any>,
  recorderRef: React.MutableRefObject<any>,
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
  // Track ref to hold the active audio track
  const audioTrackRef = useRef<MediaStreamTrack | null>(null);
  
  // Update audioTrackRef when the audio track changes
  const updateAudioTrack = useCallback(() => {
    audioTrackRef.current = getActiveAudioTrack();
  }, [getActiveAudioTrack]);

  // Handle connection state changes
  const handleConnectionStateChange = useCallback((state: RTCPeerConnectionState) => {
    console.log(`[useConnectionManager] Connection state changed to: ${state}`);
    
    if (state === "connected") {
      setIsConnected(true);
      setIsConnecting(false);
    } else if (state === "connecting") {
      setIsConnecting(true);
    } else if (state === "closed" || state === "disconnected" || state === "failed") {
      setIsConnected(false);
      setIsConnecting(false);
    }
    
    // Call the original onConnectionStateChange if provided
    if (options.onConnectionStateChange) {
      options.onConnectionStateChange(state);
    }
  }, [options, setIsConnected, setIsConnecting]);

  // Handle connection errors
  const handleConnectionError = useCallback((error: any) => {
    console.error("[useConnectionManager] Connection error:", error);
    
    // Call the original onError if provided
    if (options.onError) {
      options.onError(error);
    }
  }, [options]);

  // Use connection setup hook
  const { connect, initializeConnector } = useConnectionSetup(
    connectorRef,
    options,
    setIsConnected,
    setIsConnecting,
    audioTrackRef,
    handleConnectionStateChange,
    handleConnectionError
  );

  // Use disconnection hook
  const { disconnect } = useConnectionDisconnection(
    connectorRef,
    recorderRef,
    audioProcessorRef,
    setIsConnected,
    setIsConnecting,
    setIsMicrophoneActive,
    setCurrentTranscript,
    setIsAiSpeaking
  );

  // Use audio playback manager hook
  const { setAudioPlaybackManager } = useAudioPlaybackManager(connectorRef);

  // Update the audio track reference when the microphone is toggled
  const enhancedToggleMicrophone = useCallback(async () => {
    const result = await toggleMicrophone();
    updateAudioTrack();
    return result;
  }, [toggleMicrophone, updateAudioTrack]);

  return {
    connect,
    disconnect,
    toggleMicrophone: enhancedToggleMicrophone,
    setAudioPlaybackManager
  };
}
