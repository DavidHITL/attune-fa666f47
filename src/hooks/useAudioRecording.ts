
import { useState } from 'react';
import { toast } from 'sonner';

interface UseAudioRecordingOptions {
  onAudioData?: (audioData: Float32Array) => void;
  sampleRate?: number;
}

export function useAudioRecording(_options: UseAudioRecordingOptions = {}) {
  const [isRecording, setIsRecording] = useState<boolean>(false);
  
  // Stub implementation that always returns false and shows a message
  const startRecording = async () => {
    toast.info("Audio recording functionality has been disabled");
    return false;
  };
  
  // Empty stub implementation
  const stopRecording = () => {
    if (isRecording) {
      setIsRecording(false);
    }
  };

  return {
    isRecording,
    startRecording,
    stopRecording
  };
}
