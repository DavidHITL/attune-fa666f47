
import { useCallback } from "react";
import { WebRTCConnector } from "@/utils/realtime/WebRTCConnector";
import { AudioProcessor } from "@/utils/realtime/AudioProcessor";
import { AudioRecorder } from "@/utils/realtime/audio/AudioRecorder";

export function useMicrophoneControl(
  isConnected: boolean,
  isMicrophoneActive: boolean,
  connectorRef: React.MutableRefObject<WebRTCConnector | null>,
  recorderRef: React.MutableRefObject<AudioRecorder | null>,
  audioProcessorRef: React.MutableRefObject<AudioProcessor | null>,
  getActiveMediaStream: () => MediaStream | null,
  getActiveAudioTrack: () => MediaStreamTrack | null,
  prewarmMicrophoneAccess: () => Promise<boolean>,
  isMicrophoneReady: boolean
) {
  // Additional exports for convenience and to maintain API compatibility
  return {
    getActiveMediaStream,
    getActiveAudioTrack,
    prewarmMicrophoneAccess,
    isMicrophoneReady
  };
}
