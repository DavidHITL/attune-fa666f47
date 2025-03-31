
import { useState, useRef, useEffect } from 'react';
import { toast } from 'sonner';

interface UseAudioRecordingOptions {
  onAudioData?: (audioData: Float32Array) => void;
  sampleRate?: number;
}

export function useAudioRecording({
  onAudioData,
  sampleRate = 24000
}: UseAudioRecordingOptions = {}) {
  const [isRecording, setIsRecording] = useState<boolean>(false);
  
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const processorRef = useRef<ScriptProcessorNode | null>(null);
  const sourceRef = useRef<MediaStreamAudioSourceNode | null>(null);

  // Start microphone recording
  const startRecording = async () => {
    try {
      // Request microphone access
      mediaStreamRef.current = await navigator.mediaDevices.getUserMedia({
        audio: {
          sampleRate,
          channelCount: 1,
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        }
      });
      
      // Create audio context
      audioContextRef.current = new AudioContext({
        sampleRate,
      });
      
      // Create source and processor
      sourceRef.current = audioContextRef.current.createMediaStreamSource(mediaStreamRef.current);
      processorRef.current = audioContextRef.current.createScriptProcessor(4096, 1, 1);
      
      // Handle audio data
      processorRef.current.onaudioprocess = (e) => {
        if (onAudioData) {
          const inputData = e.inputBuffer.getChannelData(0);
          onAudioData(new Float32Array(inputData));
        }
      };
      
      // Connect nodes
      sourceRef.current.connect(processorRef.current);
      processorRef.current.connect(audioContextRef.current.destination);
      
      setIsRecording(true);
      toast.success("Microphone active");
      
    } catch (error) {
      console.error('Error accessing microphone:', error);
      toast.error("Could not access microphone");
      return false;
    }
    
    return true;
  };
  
  // Stop microphone recording
  const stopRecording = () => {
    // Disconnect processor
    if (processorRef.current) {
      processorRef.current.disconnect();
      processorRef.current = null;
    }
    
    // Disconnect source
    if (sourceRef.current) {
      sourceRef.current.disconnect();
      sourceRef.current = null;
    }
    
    // Stop all tracks
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach(track => track.stop());
      mediaStreamRef.current = null;
    }
    
    // Close audio context
    if (audioContextRef.current) {
      audioContextRef.current.close();
      audioContextRef.current = null;
    }
    
    setIsRecording(false);
  };

  // Clean up on unmount
  useEffect(() => {
    return () => {
      if (isRecording) {
        stopRecording();
      }
    };
  }, [isRecording]);
  
  return {
    isRecording,
    startRecording,
    stopRecording
  };
}
