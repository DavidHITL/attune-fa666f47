
import { useEffect } from "react";
import { AudioProcessor } from "@/utils/realtime/AudioProcessor";
import { WebRTCMessageHandler } from "@/utils/realtime/WebRTCMessageHandler";

export function useAudioProcessor(
  setIsAiSpeaking: (isAiSpeaking: boolean) => void,
  setCurrentTranscript: (currentTranscript: string) => void
): {
  audioProcessor: AudioProcessor;
  messageHandler: WebRTCMessageHandler;
} {
  // Initialize audio processor and message handler
  const audioProcessor = new AudioProcessor();
  
  // Initialize message handler with callbacks
  const messageHandler = new WebRTCMessageHandler({
    onAudioData: (base64Audio) => {
      audioProcessor.addAudioData(base64Audio);
      setIsAiSpeaking(true);
    },
    onAudioComplete: () => {
      setIsAiSpeaking(false);
    },
    onTranscriptUpdate: (textDelta) => {
      // Fixed: Store current transcript in a variable and append delta
      const newTranscript = textDelta; // Use the delta directly
      setCurrentTranscript(newTranscript);
    },
    onTranscriptComplete: () => {
      setTimeout(() => setCurrentTranscript(""), 1000);
    }
  });

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      audioProcessor.cleanup();
    };
  }, []);

  return { audioProcessor, messageHandler };
}
