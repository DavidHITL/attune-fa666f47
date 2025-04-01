
import { useCallback } from "react";
import { toast } from "sonner";

/**
 * Hook to handle WebRTC connection errors
 */
export function useConnectionErrorHandler(
  disconnect: () => void,
  setIsConnecting: (isConnecting: boolean) => void
) {
  // Handle connection errors
  const handleConnectionError = useCallback((error: any) => {
    console.error("[useConnectionErrorHandler] WebRTC error:", error);
    
    // Determine the specific type of error for better user feedback
    let errorMessage = error instanceof Error ? error.message : String(error);
    let shouldDisconnect = false;
    let toastType: 'error' | 'warning' = 'error';
    
    // Handle specific error cases
    if (errorMessage.includes("timeout") || errorMessage.includes("Data channel open timed out")) {
      errorMessage = "Connection timed out. The data channel couldn't be established.";
      shouldDisconnect = true;
    } else if (errorMessage.includes("failed to set remote description")) {
      errorMessage = "Failed to establish connection with AI service.";
      shouldDisconnect = true;
    } else if (errorMessage.includes("API Error")) {
      errorMessage = "Error communicating with OpenAI service.";
      shouldDisconnect = true;
    } else if (errorMessage.includes("Data channel closed unexpectedly")) {
      errorMessage = "Connection to AI service was lost. Attempting to reconnect...";
      toastType = 'warning'; 
      // Don't disconnect immediately for this error, let reconnection system try first
    } else if (errorMessage.includes("Remote audio track ended unexpectedly")) {
      errorMessage = "Audio connection with AI was lost. Attempting to recover...";
      toastType = 'warning';
      // Don't disconnect immediately for this error, let reconnection system try first
    }
    
    // Show error message to user
    toast[toastType](errorMessage);
    
    // Disconnect on critical errors
    if (shouldDisconnect) {
      disconnect();
      setIsConnecting(false);
    }
  }, [disconnect, setIsConnecting]);

  return {
    handleConnectionError
  };
}
