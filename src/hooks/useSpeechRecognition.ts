
import { useState } from "react";

interface SpeechRecognitionHook {
  isListening: boolean;
  transcript: string;
  toggleListening: () => void;
  isSupported: boolean;
  error: string | null;
}

export const useSpeechRecognition = (): SpeechRecognitionHook => {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState("");
  
  // Simple stub implementation
  const toggleListening = () => {
    if (isListening) {
      setIsListening(false);
    } else {
      setTranscript("");
      setIsListening(true);
      
      // Simulate turning off after a short delay
      setTimeout(() => {
        setIsListening(false);
      }, 500);
    }
  };

  return {
    isListening,
    transcript,
    toggleListening,
    isSupported: false,  // Set to false to disable the feature
    error: "Speech recognition has been disabled"
  };
};
