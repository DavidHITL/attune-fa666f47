
import { useState, useEffect, useRef, useCallback } from 'react';

interface UseSpeechRecognitionOptions {
  lang?: string;
  onAudioData?: (audioData: Float32Array) => void;
}

export function useSpeechRecognition(options: UseSpeechRecognitionOptions = {}) {
  const { lang = 'en-US', onAudioData } = options;
  
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [isSupported, setIsSupported] = useState(false);
  
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const sourceRef = useRef<MediaStreamAudioSourceNode | null>(null);
  const processorRef = useRef<ScriptProcessorNode | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  // Initialize speech recognition
  useEffect(() => {
    if (typeof window !== 'undefined' && 
        ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window)) {
      
      const SpeechRecognitionAPI = window.SpeechRecognition || window.webkitSpeechRecognition;
      recognitionRef.current = new SpeechRecognitionAPI();
      
      const recognition = recognitionRef.current;
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = lang;
      
      recognition.onresult = (event) => {
        const current = event.resultIndex;
        const result = event.results[current];
        const transcriptValue = result[0].transcript;
        
        if (result.isFinal) {
          setTranscript(prev => {
            // Only update if there's new content
            if (transcriptValue && transcriptValue !== prev) {
              return transcriptValue;
            }
            return prev;
          });
        }
      };
      
      recognition.onerror = (event) => {
        console.error('Speech recognition error', event.error);
        setIsListening(false);
      };
      
      recognition.onend = () => {
        setIsListening(false);
      };
      
      setIsSupported(true);
    } else {
      console.warn('Speech recognition not supported in this browser');
      setIsSupported(false);
    }
    
    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.abort();
      }
      
      // Clean up audio processing
      cleanupAudioProcessing();
    };
  }, [lang]);

  // Clean up audio processing resources
  const cleanupAudioProcessing = () => {
    if (sourceRef.current) {
      sourceRef.current.disconnect();
      sourceRef.current = null;
    }
    
    if (processorRef.current) {
      processorRef.current.disconnect();
      processorRef.current = null;
    }
    
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    
    if (audioContextRef.current) {
      audioContextRef.current.close();
      audioContextRef.current = null;
    }
  };
  
  // Set up audio processing if onAudioData is provided
  const setupAudioProcessing = async () => {
    if (!onAudioData) return;
    
    try {
      // Get microphone access
      streamRef.current = await navigator.mediaDevices.getUserMedia({
        audio: {
          sampleRate: 24000,
          channelCount: 1,
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        }
      });
      
      // Create audio context
      audioContextRef.current = new AudioContext({
        sampleRate: 24000,
      });
      
      // Create source node
      sourceRef.current = audioContextRef.current.createMediaStreamSource(streamRef.current);
      
      // Create processor
      processorRef.current = audioContextRef.current.createScriptProcessor(4096, 1, 1);
      
      // Set up audio processing
      processorRef.current.onaudioprocess = (e) => {
        if (onAudioData) {
          const inputData = e.inputBuffer.getChannelData(0);
          onAudioData(new Float32Array(inputData));
        }
      };
      
      // Connect nodes
      sourceRef.current.connect(processorRef.current);
      processorRef.current.connect(audioContextRef.current.destination);
    } catch (error) {
      console.error('Error setting up audio processing:', error);
    }
  };
  
  const toggleListening = useCallback(async () => {
    if (!recognitionRef.current) return;
    
    if (isListening) {
      // Stop listening
      recognitionRef.current.stop();
      cleanupAudioProcessing();
      setIsListening(false);
    } else {
      // Start listening
      try {
        // Clear previous transcript when starting new listening session
        setTranscript('');
        
        // Set up audio processing if needed
        if (onAudioData) {
          await setupAudioProcessing();
        }
        
        // Start recognition
        recognitionRef.current.start();
        setIsListening(true);
      } catch (error) {
        console.error('Error starting speech recognition:', error);
      }
    }
  }, [isListening, onAudioData]);
  
  return {
    isListening,
    transcript,
    isSupported,
    toggleListening,
  };
}
