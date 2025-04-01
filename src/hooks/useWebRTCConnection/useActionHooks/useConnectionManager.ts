
import { useCallback } from "react";
import { WebRTCConnector } from "@/utils/realtime/WebRTCConnector";
import { UseWebRTCConnectionOptions } from "../types";
import { useDisconnection } from "../useDisconnection";
import { useConnectionStateHandler } from "../useConnectionStateHandler";
import { useConnectionErrorHandler } from "../useConnectionErrorHandler";
import { toast } from "sonner";
import { AudioPlaybackManager } from "@/utils/realtime/audio/AudioPlaybackManager";

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
  // Use the disconnect hook
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

  // Use the connection error handler hook
  const { handleConnectionError } = useConnectionErrorHandler(
    disconnect,
    setIsConnecting
  );

  // Use the connection state handler hook
  const { handleConnectionStateChange } = useConnectionStateHandler(
    isConnected,
    connectorRef,
    options,
    setIsConnected,
    setIsConnecting,
    disconnect,
    toggleMicrophone
  );

  // Connect to OpenAI Realtime API
  const connect = useCallback(async () => {
    if (isConnected || isConnecting) {
      console.log("[useConnectionManagement] Already connected or connecting, aborting");
      return false;
    }
    
    try {
      console.log("[useConnectionManagement] Starting connection process");
      setIsConnecting(true);
      
      // Create a new WebRTC connector with proper options
      const connector = await createAndConfigureConnector();
      
      if (!connector) {
        console.error("[useConnectionManagement] Failed to create connector");
        setIsConnecting(false);
        toast.error("Failed to create connection");
        return false;
      }
      
      connectorRef.current = connector;
      
      // Attempt to connect with the audio track if available
      const audioTrack = getActiveAudioTrack();
      console.log("[useConnectionManagement] Connecting with audio track:", 
        audioTrack ? `${audioTrack.label} (${audioTrack.id})` : "none");
      
      console.time("WebRTC Connection Process");
      const success = await connector.connect(audioTrack || undefined);
      console.timeEnd("WebRTC Connection Process");
      
      if (!success) {
        cleanup();
        toast.error("Connection failed. Please check your API key and try again.");
        return false;
      }
      
      return true;
    } catch (error) {
      console.error("[useConnectionManagement] Connection error:", error);
      handleConnectionError(error);
      return false;
    }
  }, [
    isConnected,
    isConnecting,
    setIsConnecting,
    getActiveAudioTrack,
    handleConnectionError
  ]);

  // Helper function to create and configure WebRTC connector
  const createAndConfigureConnector = useCallback(async () => {
    try {
      // Get microphone access if needed but not already available
      let audioTrack = getActiveAudioTrack();
      if (!audioTrack && options.enableMicrophone) {
        audioTrack = await requestMicrophoneAccess();
      }
      
      // Create the connector with all necessary handlers
      const connector = new WebRTCConnector({
        ...options,
        userId: options.userId, // Pass through the userId
        onMessage: handleMessage,
        onTrack: handleTrackEvent,
        onConnectionStateChange: handleConnectionStateChange,
        onError: handleConnectionError
      });
      
      return connector;
    } catch (error) {
      console.error("[useConnectionManagement] Error creating connector:", error);
      handleConnectionError(error);
      return null;
    }
  }, [
    options,
    handleMessage,
    handleConnectionStateChange,
    handleConnectionError,
    getActiveAudioTrack
  ]);

  // Helper function to request microphone access
  const requestMicrophoneAccess = useCallback(async () => {
    try {
      console.log("[useConnectionManagement] Requesting microphone access");
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          sampleRate: 16000, // Using 16 kHz for OpenAI compatibility
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        }
      });
      
      const tracks = stream.getAudioTracks();
      if (tracks.length > 0) {
        return tracks[0];
      }
      return undefined;
    } catch (error) {
      console.warn("[useConnectionManagement] Could not access microphone:", error);
      return undefined;
    }
  }, []);

  // Handle WebRTC track events (for audio playback)
  const handleTrackEvent = useCallback((event: RTCTrackEvent) => {
    console.log("[useConnectionManagement] Received track:", 
      event.track.kind, event.track.readyState);
    
    if (event.track.kind === 'audio' && audioProcessorRef.current?.setAudioStream) {
      console.log("[useConnectionManagement] Setting audio stream for playback");
      audioProcessorRef.current.setAudioStream(event.streams[0]);
      
      // Set up track event handlers
      event.track.onunmute = () => setIsAiSpeaking(true);
      event.track.onmute = () => setTimeout(() => setIsAiSpeaking(false), 250);
      event.track.onended = () => setIsAiSpeaking(false);
    }
  }, [audioProcessorRef, setIsAiSpeaking]);

  // Helper for cleaning up after failed connection attempts
  const cleanup = useCallback(() => {
    if (connectorRef.current) {
      connectorRef.current.disconnect();
      connectorRef.current = null;
    }
    setIsConnecting(false);
  }, [connectorRef, setIsConnecting]);

  // Set audio playback manager
  const setAudioPlaybackManager = useCallback((audioManager: AudioPlaybackManager) => {
    if (connectorRef.current) {
      console.log("[useConnectionManager] Setting AudioPlaybackManager in WebRTCConnector");
      try {
        connectorRef.current.setAudioPlaybackManager(audioManager);
      } catch (error) {
        console.error("[useConnectionManager] Error setting AudioPlaybackManager:", error);
      }
    } else {
      console.warn("[useConnectionManager] Cannot set AudioPlaybackManager: No active connector");
    }
  }, [connectorRef]);

  return {
    connect,
    disconnect,
    setAudioPlaybackManager
  };
}
