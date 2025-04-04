
import { useConnectionManager as useConnectionManagerImplementation } from './connectionManager';

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
  return useConnectionManagerImplementation(
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
}
