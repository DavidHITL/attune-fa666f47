
import { useRef, useEffect } from "react";
import { AudioProcessor } from "@/utils/realtime/AudioProcessor";

// Ensure audio processor can accept a WebRTC audio stream
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
  
  // Process messages from WebRTC data channel
  const messageHandler = {
    handleMessage: (data: string) => {
      try {
        const event = JSON.parse(data);
        
        if (event.type === 'transcript') {
          setCurrentTranscript(event.text || "");
        } else if (event.type === 'speaking_started') {
          setIsAiSpeaking(true);
        } else if (event.type === 'speaking_stopped') {
          setIsAiSpeaking(false);
        }
      } catch (error) {
        console.error("Error processing WebRTC message:", error);
      }
    },
    // Add required properties to match WebRTCMessageHandler interface
    options: {},
    currentTranscript: '',
    saveTranscriptToDatabase: () => {} 
  };
  
  // Return the processor instance with proper type
  return {
    audioProcessor: audioProcessorRef.current,
    messageHandler,
    isProcessingAudio: false,
    transcriptProgress: 0
  };
}
