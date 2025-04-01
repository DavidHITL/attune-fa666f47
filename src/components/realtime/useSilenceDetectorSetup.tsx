
import { useEffect, useRef } from "react";
import { SilenceDetector } from "@/utils/realtime/audio/SilenceDetector";

interface UseSilenceDetectorSetupProps {
  handleSilenceDetected: () => void;
}

/**
 * Hook to set up and manage silence detection
 */
export function useSilenceDetectorSetup({
  handleSilenceDetected
}: UseSilenceDetectorSetupProps) {
  const silenceDetectorRef = useRef<SilenceDetector | null>(null);
  const silenceTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  
  // Initialize silence detector
  useEffect(() => {
    // Create silence detector with appropriate settings
    silenceDetectorRef.current = new SilenceDetector(
      0.01, // Silence threshold
      30,   // Silence duration frames (increased to correspond to ~3 seconds)
      handleSilenceDetected // Callback when silence is detected
    );
    
    return () => {
      if (silenceTimeoutRef.current) {
        clearTimeout(silenceTimeoutRef.current);
      }
    };
  }, [handleSilenceDetected]);

  return {
    silenceDetectorRef,
    silenceTimeoutRef
  };
}
