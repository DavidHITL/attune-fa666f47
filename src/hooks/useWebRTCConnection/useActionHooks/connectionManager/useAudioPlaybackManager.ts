
import { useCallback } from "react";
import { AudioPlaybackManager } from "@/utils/realtime/audio/AudioPlaybackManager";

export function useAudioPlaybackManager(
  connectorRef: React.MutableRefObject<any>
) {
  // Set audio playback manager
  const setAudioPlaybackManager = useCallback((audioManager: AudioPlaybackManager) => {
    if (connectorRef.current) {
      console.log("[useAudioPlaybackManager] Setting AudioPlaybackManager in WebRTCConnector");
      try {
        connectorRef.current.setAudioPlaybackManager(audioManager);
      } catch (error) {
        console.error("[useAudioPlaybackManager] Error setting AudioPlaybackManager:", error);
      }
    } else {
      console.warn("[useAudioPlaybackManager] Cannot set AudioPlaybackManager: No active connector");
    }
  }, [connectorRef]);

  return { setAudioPlaybackManager };
}
