
// Re-export all connection manager hooks
export { useConnectionInitiation } from './useConnectionInitiation';
export { useConnectionDisconnection } from './useConnectionDisconnection';
export { useTrackEventHandler } from './useTrackEventHandler';
export { useAudioPlaybackManager } from './useAudioPlaybackManager';
export { useConnectionSetup } from './useConnectionSetup';

// Main hook that combines all the focused hooks
import { useConnectionInitiation } from './useConnectionInitiation';
import { useConnectionDisconnection } from './useConnectionDisconnection';
import { useTrackEventHandler } from './useTrackEventHandler';
import { useAudioPlaybackManager } from './useAudioPlaybackManager';
import { useConnectionSetup } from './useConnectionSetup';
import { UseWebRTCConnectionOptions } from '../../types';
import { useCallback } from 'react';

export function useConnectionManager(
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
  toggleMicrophone: () => Promise<boolean>,
  getActiveAudioTrack: () => MediaStreamTrack | null
) {
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
  
  // Use connection setup hook for configuration logic
  const { 
    handleConnectionStateChange,
    handleConnectionError,
    createAndConfigureConnector
  } = useConnectionSetup(
    isConnected,
    connectorRef,
    options,
    setIsConnected,
    setIsConnecting,
    disconnect,
    toggleMicrophone,
    handleMessage,
    getActiveAudioTrack
  );
  
  // Use track event handler for audio processing
  const { handleTrackEvent } = useTrackEventHandler(
    audioProcessorRef,
    setIsAiSpeaking
  );

  // Use connection initiation hook
  const { connect } = useConnectionInitiation(
    isConnected,
    isConnecting,
    connectorRef,
    createAndConfigureConnector,
    setIsConnecting,
    handleConnectionError,
    getActiveAudioTrack,
    options
  );

  // Use audio playback manager hook
  const { setAudioPlaybackManager } = useAudioPlaybackManager(connectorRef);

  return {
    connect,
    disconnect,
    setAudioPlaybackManager
  };
}
