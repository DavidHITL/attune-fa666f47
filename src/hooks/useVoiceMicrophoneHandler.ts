import { useState, useEffect } from "react";
import { toast } from "sonner";

interface UseVoiceMicrophoneHandlerProps {
  isConnected: boolean;
  isMicrophoneActive: boolean;
  commitAudioBuffer: () => void;
  toggleMicrophone: () => Promise<boolean>;
}

export function useVoiceMicrophoneHandler({
  isConnected,
  isMicrophoneActive,
  commitAudioBuffer,
  toggleMicrophone
}: UseVoiceMicrophoneHandlerProps) {
  const [microphonePermission, setMicrophonePermission] = useState<PermissionState | null>(null);
  
  // Check microphone permissions
  useEffect(() => {
    const checkMicrophonePermission = async () => {
      try {
        const permissionStatus = await navigator.permissions.query({ name: 'microphone' as PermissionName });
        setMicrophonePermission(permissionStatus.state);
        
        // Listen for permission changes
        permissionStatus.addEventListener('change', () => {
          setMicrophonePermission(permissionStatus.state);
        });
        
        return () => {
          permissionStatus.removeEventListener('change', () => {});
        };
      } catch (error) {
        console.error("Error checking microphone permission:", error);
        // If we can't check permissions, assume we need to ask
        setMicrophonePermission(null);
      }
    };
    
    checkMicrophonePermission();
  }, []);

  // Listen for keypress events to stop recording
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (isMicrophoneActive && (e.key === ' ' || e.key === 'Escape')) {
        // If space bar or escape is pressed while mic is active, stop recording
        if (isConnected) {
          console.log("Key pressed to stop recording, committing audio buffer");
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

  // Handle microphone button click with permission checking
  const handleMicrophoneToggle = async (): Promise<boolean> => {
    // If already active, just toggle off
    if (isMicrophoneActive) {
      // When turning off the mic, commit the audio buffer to signal the end of the utterance
      // But DO NOT disconnect the entire session!
      if (isConnected) {
        commitAudioBuffer();
      }
      const success = await toggleMicrophone();
      return success;
    }
    
    // If permission is denied, show helpful message
    if (microphonePermission === 'denied') {
      toast.error("Microphone access is blocked. Please update your browser settings.");
      return false;
    }
    
    // Otherwise try to activate
    const success = await toggleMicrophone();
    
    if (!success && microphonePermission !== 'granted' && microphonePermission !== 'prompt') {
      // If failed but not explicitly denied, might be a technical issue
      toast.error("Could not access microphone. Please check your device settings.");
    }
    
    return success;
  };

  return {
    microphonePermission,
    handleMicrophoneToggle
  };
}
