
import { useEffect } from "react";

interface UseKeyboardControlProps {
  isConnected: boolean;
  isMicrophoneActive: boolean;
  commitAudioBuffer: () => void;
  toggleMicrophone: () => Promise<boolean>;
}

/**
 * Hook to handle keyboard shortcuts for microphone control
 */
export function useKeyboardControl({
  isConnected,
  isMicrophoneActive,
  commitAudioBuffer,
  toggleMicrophone
}: UseKeyboardControlProps) {
  
  // Listen for keypress events to stop recording
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (isMicrophoneActive && (e.key === ' ' || e.key === 'Escape')) {
        // If space bar or escape is pressed while mic is active, stop recording
        if (isConnected) {
          console.log("[useKeyboardControl] Key pressed to stop recording, committing audio buffer");
          commitAudioBuffer();
          setTimeout(() => {
            toggleMicrophone().catch(console.error);
          }, 100);
        }
      }
    };
    
    window.addEventListener('keyup', handleKeyPress);
    return () => window.removeEventListener('keyup', handleKeyPress);
  }, [isMicrophoneActive, isConnected, toggleMicrophone, commitAudioBuffer]);
}
