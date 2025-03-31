
import { useEffect, useRef, useState } from "react";
import { AudioProcessor } from "@/utils/realtime/AudioProcessor";
import { WebRTCMessageHandler } from "@/utils/realtime/WebRTCMessageHandler";
import { WebRTCMessage } from "../useWebRTCConnection";

export function useAudioProcessor(
  setIsAiSpeaking: (isAiSpeaking: boolean) => void,
  setCurrentTranscript: (currentTranscript: string) => void
): {
  audioProcessor: AudioProcessor;
  messageHandler: WebRTCMessageHandler;
  isProcessingAudio: boolean;
  transcriptProgress: number;
} {
  // Initialize state
  const [isProcessingAudio, setIsProcessingAudio] = useState(false);
  const [transcriptProgress, setTranscriptProgress] = useState(0);
  const lastAudioTimestampRef = useRef<number>(0);
  
  // Initialize audio processor
  const audioProcessor = new AudioProcessor();
  
  // Initialize message handler with callbacks
  const messageHandler = new WebRTCMessageHandler({
    onAudioData: (base64Audio) => {
      audioProcessor.addAudioData(base64Audio);
      setIsProcessingAudio(true);
      setIsAiSpeaking(true);
      
      // Update last audio timestamp
      lastAudioTimestampRef.current = Date.now();
    },
    onAudioComplete: () => {
      setIsAiSpeaking(false);
      // Give a short delay before considering processing complete
      setTimeout(() => {
        setIsProcessingAudio(false);
      }, 500);
    },
    onTranscriptUpdate: (fullTranscript) => {
      setCurrentTranscript(fullTranscript);
      
      // Update progress based on time since last audio chunk
      const now = Date.now();
      if (now - lastAudioTimestampRef.current > 2000) {
        setTranscriptProgress(100);
      } else {
        // Estimate progress based on time since last audio
        const progress = Math.min(100, Math.max(0, 
          (now - lastAudioTimestampRef.current) / 20));
        setTranscriptProgress(progress);
      }
    },
    onTranscriptComplete: () => {
      setTranscriptProgress(100);
      setTimeout(() => {
        setCurrentTranscript("");
        setTranscriptProgress(0);
      }, 1000);
    },
    onMessageReceived: (message: WebRTCMessage) => {
      // Additional message handling can be added here
      if (message.type === 'response.created') {
        console.log("[AudioProcessor] Response started");
        setTranscriptProgress(0);
      }
    }
  });

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      audioProcessor.cleanup();
    };
  }, []);

  return { 
    audioProcessor, 
    messageHandler, 
    isProcessingAudio,
    transcriptProgress 
  };
}
