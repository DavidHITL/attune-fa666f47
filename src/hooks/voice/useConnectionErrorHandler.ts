
import { useCallback } from "react";
import { toast } from "sonner";

/**
 * Hook to handle WebRTC connection errors and attempt reconnection
 */
export function useConnectionErrorHandler(
  connectionAttempts: number,
  maxConnectionAttempts: number,
  setConnectionAttempts: (attempts: number) => void
) {
  const handleConnectionError = useCallback((error: any) => {
    const errorMessage = error instanceof Error ? error.message : String(error);
    
    // Check for userId related errors
    if (errorMessage.includes("userId") || errorMessage.includes("context")) {
      toast.error("Connection error: Unable to load user context");
      console.error("[VoiceChat] Context-related error:", errorMessage);
    } 
    // Handle other connection errors
    else if (connectionAttempts < maxConnectionAttempts) {
      const newAttemptCount = connectionAttempts + 1;
      setConnectionAttempts(newAttemptCount);
      toast.warning(`Connection failed. Attempting to reconnect (${newAttemptCount}/${maxConnectionAttempts})...`);
      
      // Wait a moment before reconnecting
      setTimeout(() => {
        // Note: connect function will be passed in the parent component
        console.log("[VoiceChat] Attempting reconnection...");
      }, 1500);
    } else {
      toast.error("Connection failed after multiple attempts. Please try again later.");
    }
  }, [connectionAttempts, maxConnectionAttempts, setConnectionAttempts]);

  return handleConnectionError;
}
