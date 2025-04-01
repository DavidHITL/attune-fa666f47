
import { useConnectionManagement } from "./useConnectionManagement";
import { useMicrophoneControl } from "./useMicrophoneControl";
import { useMessageSender } from "./useMessageSender";
import { UseWebRTCConnectionOptions, WebRTCMessage } from "./types";
import { WebRTCConnector } from "@/utils/realtime/WebRTCConnector";
import { AudioRecorder } from "@/utils/realtime/AudioRecorder";
import { AudioProcessor } from "@/utils/realtime/AudioProcessor";
import { useEffect, useState } from "react";

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
  setMessages: (message: WebRTCMessage) => void
) {
  const [isDataChannelReady, setIsDataChannelReady] = useState<boolean>(false);

  // Initialize microphone control hooks first
  const { 
    toggleMicrophone,
    getActiveMediaStream,
    getActiveAudioTrack,
    prewarmMicrophoneAccess,
    isMicrophoneReady
  } = useMicrophoneControl(
    isConnected,
    isMicrophoneActive,
    connectorRef,
    recorderRef,
    setIsMicrophoneActive
  );

  // Then initialize connection management hooks that depend on toggleMicrophone
  const { connect, disconnect } = useConnectionManagement(
    isConnected,
    isConnecting,
    connectorRef,
    audioProcessorRef,
    recorderRef,
    handleMessage,
    options,
    setIsConnected,
    setIsConnecting,
    setIsMicrophoneActive,
    setCurrentTranscript,
    setIsAiSpeaking,
    toggleMicrophone,
    getActiveAudioTrack
  );

  // Initialize message sending hooks
  const { sendTextMessage } = useMessageSender(
    isConnected,
    connectorRef
  );
  
  // Periodically check if the data channel is ready
  useEffect(() => {
    if (!isConnected || !connectorRef.current) {
      setIsDataChannelReady(false);
      return;
    }
    
    const checkDataChannelReady = () => {
      const isReady = connectorRef.current?.isDataChannelReady() || false;
      if (isReady !== isDataChannelReady) {
        setIsDataChannelReady(isReady);
        if (isReady) {
          console.log("[useConnectionActions] Data channel is now ready for sending data");
        }
      }
    };
    
    // Check immediately
    checkDataChannelReady();
    
    // Then check periodically
    const interval = setInterval(checkDataChannelReady, 1000);
    
    return () => clearInterval(interval);
  }, [isConnected, connectorRef, isDataChannelReady]);

  // Prewarm microphone access when autoConnect is enabled
  useEffect(() => {
    if (options.autoConnect && !isConnected && !isConnecting) {
      console.log("[useConnectionActions] Pre-warming microphone for auto-connect");
      prewarmMicrophoneAccess().catch(err => {
        console.warn("[useConnectionActions] Failed to pre-warm microphone:", err);
      });
    }
  }, [options.autoConnect, isConnected, isConnecting, prewarmMicrophoneAccess]);

  return {
    connect,
    disconnect,
    toggleMicrophone,
    sendTextMessage,
    getActiveMediaStream,
    getActiveAudioTrack,
    prewarmMicrophoneAccess,
    isMicrophoneReady,
    isDataChannelReady
  };
}
