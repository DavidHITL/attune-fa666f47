
import { useCallback } from "react";
import { toast } from "sonner";
import { UseConnectionErrorHandlerProps } from "./types";

/**
 * Hook to handle connection errors and retry logic
 */
export function useConnectionErrorHandler({
  userId,
  connectionAttempts,
  maxConnectionAttempts,
  setConnectionAttempts,
  connect
}: UseConnectionErrorHandlerProps) {
  
  /**
   * Handle connection errors with smart retry logic
   */
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
        if (connect) connect().catch(console.error);
      }, 1500);
    } else {
      toast.error("Connection failed after multiple attempts. Please try again later.");
    }
  }, [connectionAttempts, maxConnectionAttempts, connect, setConnectionAttempts, userId]);

  return {
    handleConnectionError
  };
}
