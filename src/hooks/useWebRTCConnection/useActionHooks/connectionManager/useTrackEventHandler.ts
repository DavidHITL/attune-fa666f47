
import { useCallback } from "react";

export function useTrackEventHandler(
  audioProcessorRef: React.MutableRefObject<any>,
  setIsAiSpeaking: (isAiSpeaking: boolean) => void
) {
  // Handle WebRTC track events (for audio playback)
  const handleTrackEvent = useCallback((event: RTCTrackEvent) => {
    console.log("[useTrackEventHandler] Received track:", 
      event.track.kind, event.track.readyState);
    
    if (event.track.kind === 'audio' && audioProcessorRef.current?.setAudioStream) {
      console.log("[useTrackEventHandler] Setting audio stream for playback");
      audioProcessorRef.current.setAudioStream(event.streams[0]);
      
      // Set up track event handlers
      event.track.onunmute = () => setIsAiSpeaking(true);
      event.track.onmute = () => setTimeout(() => setIsAiSpeaking(false), 250);
      event.track.onended = () => setIsAiSpeaking(false);
    }
  }, [audioProcessorRef, setIsAiSpeaking]);

  return { handleTrackEvent };
}
