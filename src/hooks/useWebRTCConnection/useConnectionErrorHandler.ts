
import { useCallback } from "react";
import { toast } from "sonner";

export function useConnectionErrorHandler(
  disconnect: () => void,
  setIsConnecting: (isConnecting: boolean) => void
) {
  // Handle connection errors
  const handleConnectionError = useCallback((error: any) => {
    console.error("[useConnectionErrorHandler] WebRTC error:", error);
    toast.error(`WebRTC error: ${error instanceof Error ? error.message : String(error)}`);
    
    // Only disconnect on critical errors
    if (error instanceof Error &&
       (error.message.includes("timeout") || 
        error.message.includes("failed to set remote description") ||
        error.message.includes("API Error"))) {
      disconnect();
      setIsConnecting(false);
    }
  }, [disconnect, setIsConnecting]);

  return {
    handleConnectionError
  };
}
