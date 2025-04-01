
import { useCallback } from "react";
import { WebRTCConnector } from "@/utils/realtime/WebRTCConnector";

/**
 * Hook to handle silence detection and audio buffer commitment
 * @param connectorRef Reference to the WebRTC connector
 * @param isMicrophoneActive Whether the microphone is active
 * @returns Methods for handling silence detection
 */
export function useSilenceDetection(
  connectorRef: React.MutableRefObject<WebRTCConnector | null>,
  isMicrophoneActive: boolean
) {
  // Function to handle silence detection and commit audio buffer
  const handleSilenceDetected = useCallback(() => {
    if (connectorRef.current && isMicrophoneActive) {
      console.log("[useSilenceDetection] Silence detected, committing audio buffer");
      connectorRef.current.commitAudioBuffer();
    }
  }, [connectorRef, isMicrophoneActive]);

  return {
    handleSilenceDetected
  };
}
