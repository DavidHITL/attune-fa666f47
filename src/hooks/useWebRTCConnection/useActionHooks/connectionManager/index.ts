
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
import { useCallback, useRef } from 'react';
import { WebRTCConnector } from '@/utils/realtime/WebRTCConnector';
import { useConnectionErrorHandler } from '../../useConnectionErrorHandler';
import { useConnectionStateHandler } from '../../useConnectionStateHandler';

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
  // Track reference for audio
  const audioTrackRef = useRef<MediaStreamTrack | null>(null);

  // Use connection error handler
  const { handleConnectionError } = useConnectionErrorHandler(
    () => disconnect(), 
    setIsConnecting
  );

  // Use connection state handler
  const { handleConnectionStateChange } = useConnectionStateHandler(
    isConnected,
    options,
    setIsConnected,
    setIsConnecting,
    () => disconnect(),
    toggleMicrophone,
  );

  // Create a function to create and configure connector
  const createAndConfigureConnector = useCallback(async () => {
    try {
      const connector = new WebRTCConnector({
        model: options.model || "gpt-4o-realtime-preview-2024-12-17",
        voice: options.voice || "alloy",
        instructions: options.instructions,
        userId: options.userId,
        onMessage: handleMessage,
        onConnectionStateChange: handleConnectionStateChange,
        onError: handleConnectionError
      });
      return connector;
    } catch (error) {
      handleConnectionError(error);
      return null;
    }
  }, [options, handleMessage, handleConnectionStateChange, handleConnectionError]);

  // Use connection setup hook - make sure to pass all 7 required arguments
  const { connect: setupConnect, initializeConnector } = useConnectionSetup(
    connectorRef,
    options,
    setIsConnected,
    setIsConnecting,
    audioTrackRef,
    handleConnectionStateChange,
    handleConnectionError
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
  
  // Use track event handler for audio processing
  const { handleTrackEvent } = useTrackEventHandler(
    audioProcessorRef,
    setIsAiSpeaking
  );

  // Use audio playback manager hook
  const { setAudioPlaybackManager } = useAudioPlaybackManager(connectorRef);

  return {
    connect,
    disconnect,
    setAudioPlaybackManager
  };
}
