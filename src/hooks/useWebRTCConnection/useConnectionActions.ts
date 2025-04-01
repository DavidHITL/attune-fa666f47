
import { useEffect, useState } from "react";
import { useConnectionManagement } from "./useConnectionManagement";
import { useMicrophoneControl } from "./useMicrophoneControl";
import { useMessageSender } from "./useMessageSender";
import { useDataChannelStatus } from "./useDataChannelStatus";
import { UseWebRTCConnectionOptions, WebRTCMessage } from "./types";
import { WebRTCConnector } from "@/utils/realtime/WebRTCConnector";
import { AudioRecorder } from "@/utils/realtime/AudioRecorder";
import { AudioProcessor } from "@/utils/realtime/AudioProcessor";

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
  const { sendTextMessage, sendAudioData, commitAudioBuffer } = useMessageSender(
    isConnected,
    connectorRef
  );
  
  // Monitor data channel readiness
  const { isDataChannelReady } = useDataChannelStatus(
    isConnected,
    connectorRef
  );
  
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
    sendAudioData,
    commitAudioBuffer,
    getActiveMediaStream,
    getActiveAudioTrack,
    prewarmMicrophoneAccess,
    isMicrophoneReady,
    isDataChannelReady
  };
}
