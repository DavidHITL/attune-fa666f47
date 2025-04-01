import { useRef, useEffect } from "react";

// Ensure audio processor can accept a WebRTC audio stream
export function useAudioProcessor(
  setIsAiSpeaking: (isAiSpeaking: boolean) => void,
  setCurrentTranscript: (transcript: string) => void
) {
  const audioContextRef = useRef<AudioContext | null>(null);
  const audioSourceRef = useRef<MediaStreamAudioSourceNode | null>(null);
  
  useEffect(() => {
    // Create audio context for processing
    audioContextRef.current = new AudioContext();
    
    return () => {
      if (audioContextRef.current) {
        audioContextRef.current.close().catch(console.error);
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
    }
  };
  
  // Audio processor interface for WebRTC audio handling
  const audioProcessor = {
    // Method to set audio stream received from WebRTC
    setAudioStream: (stream: MediaStream) => {
      console.log("[AudioProcessor] Setting audio stream for playback");
      
      // If there's an existing audio source, disconnect it
      if (audioSourceRef.current) {
        audioSourceRef.current.disconnect();
      }
      
      if (audioContextRef.current) {
        try {
          // Create a new audio source from the stream
          audioSourceRef.current = audioContextRef.current.createMediaStreamSource(stream);
          
          // Connect to the audio context destination (speakers)
          audioSourceRef.current.connect(audioContextRef.current.destination);
          
          console.log("[AudioProcessor] Audio stream connected to speakers");
          setIsAiSpeaking(true); // Indicate AI is now speaking
          
        } catch (error) {
          console.error("[AudioProcessor] Error connecting audio stream:", error);
        }
      }
    },
    
    // Clean up audio processing resources
    cleanup: () => {
      console.log("[AudioProcessor] Cleaning up audio resources");
      
      if (audioSourceRef.current) {
        audioSourceRef.current.disconnect();
        audioSourceRef.current = null;
      }
      
      setIsAiSpeaking(false);
    }
  };
  
  return {
    audioProcessor,
    messageHandler,
    isProcessingAudio: false, // This would be updated based on audio processing state
    transcriptProgress: 0 // This would be updated based on transcript progress
  };
}
