
import { useConnectionManagement } from "./useConnectionManagement";
import { useMicrophoneControl } from "./useMicrophoneControl";
import { useDataChannelStatus } from "./useDataChannelStatus";
import { UseWebRTCConnectionOptions, WebRTCMessage } from "./types";
import { WebRTCConnector } from "@/utils/realtime/WebRTCConnector";
import { AudioProcessor } from "@/utils/realtime/AudioProcessor";
import { AudioRecorder } from "@/utils/realtime/audio/AudioRecorder";
import { 
  useConnectionInitializer,
  useConnectionManager,
  useMessageManager
} from "./useActionHooks";

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
  const { connect, disconnect } = useConnectionManager(
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
  const { sendTextMessage, commitAudioBuffer } = useMessageManager(
    isConnected,
    connectorRef,
    isDataChannelReady
  );
  
  // Monitor data channel readiness
  const { isDataChannelReady } = useDataChannelStatus(
    isConnected,
    connectorRef
  );
  
  // Initialize microphone prewarming
  useConnectionInitializer(
    options,
    isConnected,
    isConnecting,
    connectorRef,
    prewarmMicrophoneAccess
  );

  return {
    connect,
    disconnect,
    toggleMicrophone,
    sendTextMessage,
    commitAudioBuffer,
    getActiveMediaStream,
    getActiveAudioTrack,
    prewarmMicrophoneAccess,
    isMicrophoneReady,
    isDataChannelReady
  };
}
