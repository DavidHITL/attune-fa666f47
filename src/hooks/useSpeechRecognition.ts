
import { useState, useEffect, useCallback } from "react";

interface SpeechRecognitionHook {
  isListening: boolean;
  transcript: string;
  toggleListening: () => void;
  isSupported: boolean;
  error: string | null;
}

// Define types for the speech recognition API
interface SpeechRecognitionEvent {
  results: SpeechRecognitionResultList;
}

interface SpeechRecognitionResultList {
  item(index: number): SpeechRecognitionResult;
  length: number;
}

interface SpeechRecognitionResult {
  isFinal: boolean;
  item(index: number): SpeechRecognitionAlternative;
  length: number;
}

interface SpeechRecognitionAlternative {
  transcript: string;
  confidence: number;
}

// Declare SpeechRecognition global type
declare global {
  interface Window {
    SpeechRecognition?: new () => SpeechRecognition;
    webkitSpeechRecognition?: new () => SpeechRecognition;
  }
}

interface SpeechRecognition extends EventTarget {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  start: () => void;
  stop: () => void;
  onresult: (event: SpeechRecognitionEvent) => void;
  onerror: (event: any) => void;
  onend: () => void;
}

export const useSpeechRecognition = (): SpeechRecognitionHook => {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSupported, setIsSupported] = useState(false);
  const [recognition, setRecognition] = useState<SpeechRecognition | null>(null);

  // Initialize speech recognition
  useEffect(() => {
    // Check if browser supports SpeechRecognition API
    const SpeechRecognitionAPI = window.SpeechRecognition || window.webkitSpeechRecognition;
    
    if (!SpeechRecognitionAPI) {
      setIsSupported(false);
      return;
    }
    
    setIsSupported(true);
    
    // Initialize recognition
    const recognitionInstance = new SpeechRecognitionAPI();
    recognitionInstance.continuous = true;
    recognitionInstance.interimResults = true;
    recognitionInstance.lang = 'en-US'; // Default to English
    
    // Set up event handlers
    recognitionInstance.onresult = (event: SpeechRecognitionEvent) => {
      // Get the latest result
      const result = event.results[event.results.length - 1];
      if (result) {
        const newTranscript = result[0].transcript;
        setTranscript(newTranscript);
      }
    };
    
    recognitionInstance.onerror = (event) => {
      setError(`Speech recognition error: ${event.error}`);
      setIsListening(false);
    };
    
    recognitionInstance.onend = () => {
      setIsListening(false);
    };
    
    setRecognition(recognitionInstance);
    
    // Cleanup on unmount
    return () => {
      if (recognitionInstance && isListening) {
        recognitionInstance.stop();
      }
    };
  }, []);

  // Toggle listening
  const toggleListening = useCallback(() => {
    if (!recognition) return;
    
    if (isListening) {
      recognition.stop();
      setIsListening(false);
    } else {
      // Clear previous transcript when starting new listening session
      setTranscript("");
      setError(null);
      
      try {
        recognition.start();
        setIsListening(true);
      } catch (err) {
        setError(`Failed to start speech recognition: ${err}`);
      }
    }
  }, [isListening, recognition]);

  return {
    isListening,
    transcript,
    toggleListening,
    isSupported,
    error
  };
};
