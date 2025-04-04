
import { useCallback, useEffect } from "react";
import { AudioPlaybackManager } from "@/utils/realtime/audio/AudioPlaybackManager";

export function useAudioPlaybackManager(
  connectorRef: React.MutableRefObject<any>,
  isConnected: boolean
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

  // Auto retry setting the audio playback manager when connection state changes
  useEffect(() => {
    if (isConnected && connectorRef.current && connectorRef.current._audioPlaybackManager) {
      console.log("[useAudioPlaybackManager] Connection established, ensuring AudioPlaybackManager is set");
      setAudioPlaybackManager(connectorRef.current._audioPlaybackManager);
    }
  }, [isConnected, connectorRef, setAudioPlaybackManager]);

  return { setAudioPlaybackManager };
}
