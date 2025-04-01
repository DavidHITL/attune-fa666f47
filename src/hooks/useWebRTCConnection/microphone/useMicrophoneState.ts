
import { useState, useEffect } from "react";

/**
 * Hook to manage microphone permission state
 * @returns Current microphone permission state
 */
export function useMicrophoneState() {
  const [microphoneReady, setMicrophoneReady] = useState<boolean>(false);
  const [microphonePermission, setMicrophonePermission] = useState<PermissionState | null>(null);

  // Check microphone permissions on mount
  useEffect(() => {
    const checkMicrophonePermission = async () => {
      try {
        const permissionStatus = await navigator.permissions.query({ name: 'microphone' as PermissionName });
        setMicrophonePermission(permissionStatus.state);
        setMicrophoneReady(permissionStatus.state === 'granted');
        
        // Listen for permission changes
        permissionStatus.addEventListener('change', () => {
          setMicrophonePermission(permissionStatus.state);
          setMicrophoneReady(permissionStatus.state === 'granted');
        });
        
        return () => {
          permissionStatus.removeEventListener('change', () => {});
        };
      } catch (error) {
        console.warn("[useMicrophoneState] Could not check microphone permission:", error);
        // If we can't check permissions, assume we need to ask
        setMicrophonePermission(null);
      }
    };
    
    checkMicrophonePermission();
  }, []);

  return {
    microphoneReady,
    microphonePermission,
    setMicrophoneReady
  };
}
