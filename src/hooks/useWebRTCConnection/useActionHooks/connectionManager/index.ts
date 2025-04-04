
import { useCallback } from "react";
import { useConnectionDisconnection } from "./useConnectionDisconnection";
import { useConnectionInitiation } from "./useConnectionInitiation";
import { useTrackEventHandler } from "./useTrackEventHandler";
import { useAudioPlaybackManager } from "./useAudioPlaybackManager";

/**
 * Hook to manage WebRTC connection and related operations
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
  // Use the track event handler
  const { handleTrackEvent } = useTrackEventHandler(
    audioProcessorRef,
    setIsAiSpeaking
  );
  
  // Use the connection initiation hook
  const { connect, sendTextMessage, commitAudioBuffer } = useConnectionInitiation(
    connectorRef,
    audioProcessorRef,
    recorderRef,
    options,
    isConnected,
    isConnecting,
    setIsConnecting,
    handleMessage,
    handleTrackEvent,
    getActiveAudioTrack
  );
  
  // Use the connection disconnection hook
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
  
  // Use the audio playback manager hook
  const { setAudioPlaybackManager } = useAudioPlaybackManager(
    connectorRef,
    isConnected
  );
  
  // Get active media stream
  const getActiveMediaStream = useCallback(() => {
    if (recorderRef.current) {
      return recorderRef.current.getStream();
    }
    return null;
  }, [recorderRef]);
  
  // Return all the connection manager functionality
  return {
    connect,
    disconnect,
    sendTextMessage,
    commitAudioBuffer,
    getActiveMediaStream,
    setAudioPlaybackManager
  };
}
