
import { useRef, useEffect } from "react";
import { AudioProcessor } from "@/utils/realtime/AudioProcessor";
import { WebRTCMessageHandler } from "@/utils/realtime/WebRTCMessageHandler";
import { WebRTCMessageHandlerOptions } from "@/hooks/useWebRTCConnection/types";

/**
 * Hook to manage audio processing for WebRTC connections
 */
export function useAudioProcessor(
  setIsAiSpeaking: (isAiSpeaking: boolean) => void,
  setCurrentTranscript: (transcript: string) => void
) {
  const audioContextRef = useRef<AudioContext | null>(null);
  const audioSourceRef = useRef<MediaStreamAudioSourceNode | null>(null);
  const audioProcessorRef = useRef<AudioProcessor | null>(null);
  
  useEffect(() => {
    // Create audio context for processing
    audioContextRef.current = new AudioContext();
    
    // Initialize the AudioProcessor instance
    audioProcessorRef.current = new AudioProcessor();
    
    return () => {
      if (audioContextRef.current) {
        audioContextRef.current.close().catch(console.error);
      }
      
      if (audioProcessorRef.current) {
        audioProcessorRef.current.cleanup();
      }
    };
  }, []);
  
  // Create a proper WebRTCMessageHandler instance with options
  const messageHandlerOptions: WebRTCMessageHandlerOptions = {
    onTranscriptUpdate: setCurrentTranscript,
    onAudioComplete: () => setIsAiSpeaking(false),
    onAudioData: () => setIsAiSpeaking(true),
  };
  
  // Create an actual WebRTCMessageHandler instance instead of a plain object
  const messageHandler = new WebRTCMessageHandler(messageHandlerOptions);
  
  // Return the processor instance with proper type
  return {
    audioProcessor: audioProcessorRef.current,
    messageHandler,
    isProcessingAudio: false,
    transcriptProgress: 0
  };
}
