
import { useState, useEffect } from "react";
import { toast } from "@/hooks/use-toast";

type UseSpeechRecognitionProps = {
  onTranscript?: (transcript: string) => void;
};

export function useSpeechRecognition({ onTranscript }: UseSpeechRecognitionProps = {}) {
  const [isListening, setIsListening] = useState(false);
  const [recognition, setRecognition] = useState<SpeechRecognition | null>(null);
  const [isSupported, setIsSupported] = useState(false);

  // Initialize speech recognition on component mount
  useEffect(() => {
    const isBrowserSupported = 'SpeechRecognition' in window || 'webkitSpeechRecognition' in window;
    setIsSupported(isBrowserSupported);

    if (isBrowserSupported) {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      const recognitionInstance = new SpeechRecognition();
      
      recognitionInstance.continuous = false;
      recognitionInstance.interimResults = false;
      recognitionInstance.lang = 'en-US';
      
      recognitionInstance.onresult = (event) => {
        const transcript = event.results[0][0].transcript;
        if (onTranscript) {
          onTranscript(transcript.trim());
        }
      };
      
      recognitionInstance.onend = () => {
        setIsListening(false);
      };
      
      recognitionInstance.onerror = (event) => {
        console.error('Speech recognition error', event.error);
        setIsListening(false);
      };
      
      setRecognition(recognitionInstance);
    }
    
    return () => {
      if (recognition) {
        recognition.abort();
      }
    };
  }, [onTranscript]);

  const toggleListening = () => {
    if (!recognition) {
      toast({
        title: "Not supported",
        description: "Speech recognition is not supported in your browser.",
        variant: "destructive"
      });
      return;
    }

    if (isListening) {
      recognition.stop();
      setIsListening(false);
    } else {
      try {
        recognition.start();
        setIsListening(true);
      } catch (error) {
        console.error('Speech recognition error:', error);
      }
    }
  };

  return {
    isListening,
    toggleListening,
    isSupported
  };
}
