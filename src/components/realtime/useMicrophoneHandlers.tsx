
import { useState, useCallback } from 'react';

interface UseMicrophoneHandlersProps {
  isConnected: boolean;
  silenceTimeoutRef: React.MutableRefObject<NodeJS.Timeout | null>;
  silenceDetectorRef: React.MutableRefObject<any>;
  onAiSpeaking?: (speaking: boolean) => void;
}

/**
 * Hook to manage microphone state and handlers
 */
export function useMicrophoneHandlers({
  isConnected,
  silenceTimeoutRef,
  silenceDetectorRef,
  onAiSpeaking
}: UseMicrophoneHandlersProps) {
  const [isMicrophoneActive, setIsMicrophoneActive] = useState(false);
  const [isAiSpeaking, setIsAiSpeaking] = useState(false);
  
  // Handle silence detection
  const handleSilenceDetected = useCallback(() => {
    console.log("Silence detected, committing audio buffer");
    
    // Only act if the microphone is active and we're not already processing
    if (isMicrophoneActive && !silenceTimeoutRef.current) {
      console.log("Scheduling audio buffer commit after silence");
      
      // Set a short delay before committing to avoid premature commits on brief pauses
      silenceTimeoutRef.current = setTimeout(() => {
        console.log("Committing audio buffer due to silence");
        
        // In a real implementation, this would commit the audio buffer
        // For now, we'll just simulate by triggering the AI speaking
        simulateAiResponse();
        
        // Clear the timeout reference
        silenceTimeoutRef.current = null;
      }, 500);
    }
  }, [isMicrophoneActive, silenceTimeoutRef]);
  
  // Simulate AI response 
  const simulateAiResponse = useCallback(() => {
    // Only proceed if we're connected and microphone is active
    if (isConnected) {
      // First temporarily disable the microphone during AI response
      setIsMicrophoneActive(false);
      
      // Then trigger AI speaking state
      console.log("AI speaking started");
      setIsAiSpeaking(true);
      if (onAiSpeaking) onAiSpeaking(true);
      
      // Simulate AI response duration
      setTimeout(() => {
        console.log("AI speaking ended");
        setIsAiSpeaking(false);
        if (onAiSpeaking) onAiSpeaking(false);
        
        // Re-activate the microphone after AI finishes speaking
        setTimeout(() => {
          if (isConnected) {
            setIsMicrophoneActive(true);
            console.log("Microphone reactivated after AI response");
          }
        }, 300);
      }, 2000);
    }
  }, [isConnected, onAiSpeaking]);
  
  // Handle microphone toggle
  const handleMicrophoneToggle = useCallback(async () => {
    console.log("Microphone toggle requested, current state:", isMicrophoneActive);
    
    // Only allow toggling if connected
    if (!isConnected) {
      console.log("Cannot toggle microphone: not connected");
      return false;
    }
    
    if (isMicrophoneActive) {
      setIsMicrophoneActive(false);
      console.log("Microphone deactivated");
      
      // Clear any pending silence timeouts when manually deactivating
      if (silenceTimeoutRef.current) {
        clearTimeout(silenceTimeoutRef.current);
        silenceTimeoutRef.current = null;
      }
      
      return true;
    } else {
      setIsMicrophoneActive(true);
      console.log("Microphone activated");
      
      // Reset silence detector when starting to listen
      if (silenceDetectorRef.current) {
        silenceDetectorRef.current.reset();
      }
      
      return true;
    }
  }, [isConnected, isMicrophoneActive, silenceTimeoutRef, silenceDetectorRef]);
  
  // Process audio data
  const processAudioData = useCallback((audioData: Float32Array) => {
    if (isMicrophoneActive && silenceDetectorRef.current) {
      const isSilent = silenceDetectorRef.current.isSilence(audioData);
      
      if (isSilent) {
        silenceDetectorRef.current.incrementSilenceFrames();
        if (silenceDetectorRef.current.isSilenceDurationExceeded()) {
          silenceDetectorRef.current.onSilenceDetected();
          silenceDetectorRef.current.reset();
        }
      } else {
        silenceDetectorRef.current.resetSilenceFrames();
      }
    }
  }, [isMicrophoneActive, silenceDetectorRef]);
  
  return {
    isMicrophoneActive,
    isAiSpeaking,
    handleMicrophoneToggle,
    handleSilenceDetected,
    processAudioData
  };
}
