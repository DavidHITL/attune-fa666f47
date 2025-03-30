
import { useState, useEffect, useRef } from 'react';
import { toast } from 'sonner';

export function useVoiceChatRecognition() {
  const [transcript, setTranscript] = useState("");
  const [isRecording, setIsRecording] = useState(false);
  const recognitionRef = useRef<SpeechRecognition | null>(null);

  // Initialize speech recognition
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      
      if (SpeechRecognition) {
        recognitionRef.current = new SpeechRecognition();
        const recognition = recognitionRef.current;
        
        recognition.continuous = true;
        recognition.interimResults = true;
        
        recognition.onresult = (event) => {
          const current = event.resultIndex;
          const result = event.results[current];
          const transcriptResult = result[0].transcript;
          
          console.log("[useVoiceChatRecognition] Speech recognition result:", transcriptResult);
          
          if (result.isFinal) {
            setTranscript(prevTranscript => prevTranscript + " " + transcriptResult);
          } else {
            // Update with interim result
            setTranscript(prevTranscript => prevTranscript + " " + transcriptResult);
          }
        };

        recognition.onerror = (event) => {
          console.error("[useVoiceChatRecognition] Speech recognition error", event.error);
          setIsRecording(false);
          toast.error("Error with speech recognition: " + event.error);
        };

        recognition.onend = () => {
          console.log("[useVoiceChatRecognition] Speech recognition ended");
          setIsRecording(false);
        };
      }
    }

    return () => {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch (error) {
          console.error("[useVoiceChatRecognition] Error stopping recognition", error);
        }
      }
    };
  }, []);

  const startRecording = () => {
    if (recognitionRef.current) {
      try {
        console.log("[useVoiceChatRecognition] Starting speech recognition");
        recognitionRef.current.start();
        setIsRecording(true);
        toast.info("Listening...");
      } catch (error) {
        console.error("[useVoiceChatRecognition] Error starting speech recognition", error);
        toast.error("Couldn't start speech recognition");
      }
    } else {
      toast.error("Speech recognition not supported in this browser");
    }
  };

  const stopRecording = () => {
    if (recognitionRef.current) {
      console.log("[useVoiceChatRecognition] Stopping speech recognition");
      recognitionRef.current.stop();
      setIsRecording(false);
    }
  };

  return {
    transcript,
    setTranscript,
    isRecording,
    startRecording,
    stopRecording
  };
}
