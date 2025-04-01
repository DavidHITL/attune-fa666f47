
import { useCallback } from "react";
import { AudioRecorder } from "@/utils/realtime/audio/AudioRecorder";
import { WebRTCConnector } from "@/utils/realtime/WebRTCConnector";
import { useSilenceDetection } from "./useSilenceDetection";
import { useMediaStreamManager } from "./useMediaStreamManager";
import { useMicrophoneState } from "./microphone/useMicrophoneState";
import { useMicrophoneToggle } from "./microphone/useMicrophoneToggle";
import { useMicrophonePrewarm } from "./microphone/useMicrophonePrewarm";
import { useKeyboardControl } from "./microphone/useKeyboardControl";

export function useMicrophoneControl(
  isConnected: boolean,
  isMicrophoneActive: boolean,
  connectorRef: React.MutableRefObject<WebRTCConnector | null>,
  recorderRef: React.MutableRefObject<AudioRecorder | null>,
  setIsMicrophoneActive: (isMicrophoneActive: boolean) => void
) {
  // Use the media stream manager hook
  const { 
    mediaStreamRef, 
    getActiveMediaStream, 
    getActiveAudioTrack, 
    setMediaStream 
  } = useMediaStreamManager();
  
  // Use microphone state management hook
  const {
    microphoneReady,
    microphonePermission,
    setMicrophoneReady
  } = useMicrophoneState();

  // Use the silence detection hook
  const { handleSilenceDetected } = useSilenceDetection(connectorRef, isMicrophoneActive);

  // Use the microphone toggle hook
  const { toggleMicrophone } = useMicrophoneToggle({
    isConnected,
    isMicrophoneActive,
    microphonePermission,
    connectorRef,
    recorderRef,
    mediaStreamRef,
    setMediaStream,
    setIsMicrophoneActive,
    setMicrophoneReady,
    handleSilenceDetected
  });

  // Use the microphone prewarm hook
  const { prewarmMicrophoneAccess } = useMicrophonePrewarm({
    getActiveMediaStream,
    setMediaStream,
    setMicrophoneReady
  });

  // Get a commit function for the audio buffer
  const commitAudioBuffer = useCallback(() => {
    if (connectorRef.current) {
      connectorRef.current.commitAudioBuffer();
    }
  }, [connectorRef]);

  // Use keyboard control hook
  useKeyboardControl({
    isConnected,
    isMicrophoneActive,
    commitAudioBuffer,
    toggleMicrophone
  });

  return {
    toggleMicrophone,
    getActiveMediaStream,
    getActiveAudioTrack,
    prewarmMicrophoneAccess,
    isMicrophoneReady: microphoneReady,
    microphonePermission
  };
}
