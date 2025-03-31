
import { useConnectionManagement } from "./useConnectionManagement";
import { useMicrophoneControl } from "./useMicrophoneControl";
import { useMessageSender } from "./useMessageSender";
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
    getActiveAudioTrack 
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

  return {
    connect,
    disconnect,
    toggleMicrophone,
    sendTextMessage,
    getActiveMediaStream,
    getActiveAudioTrack
  };
}
