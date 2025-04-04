
import { useRef, useEffect } from "react";
import { AudioPlaybackManager } from "@/utils/realtime/audio/AudioPlaybackManager";

/**
 * Hook to manage the audio playback manager lifecycle
 */
export function useAudioPlaybackManager() {
  const audioRef = useRef<HTMLAudioElement>(null);
  const audioPlaybackManager = useRef<AudioPlaybackManager | null>(null);

  // Initialize audio playback manager
  useEffect(() => {
    if (!audioPlaybackManager.current) {
      audioPlaybackManager.current = new AudioPlaybackManager();
      console.log("[VoiceChat] AudioPlaybackManager initialized");
    }
    
    return () => {
      if (audioPlaybackManager.current) {
        audioPlaybackManager.current.cleanup();
        audioPlaybackManager.current = null;
      }
    };
  }, []);

  return {
    audioRef,
    audioPlaybackManager
  };
}
