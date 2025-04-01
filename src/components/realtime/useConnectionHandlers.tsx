
import { useState, useCallback } from 'react';
import { toast } from "sonner";

interface UseConnectionHandlersProps {
  autoConnect?: boolean;
}

/**
 * Hook to manage voice chat connection state and handlers
 */
export function useConnectionHandlers({
  autoConnect = true // Changed default to true
}: UseConnectionHandlersProps = {}) {
  const [isConnected, setIsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  
  // Function to handle connection to voice chat
  const connectVoiceChat = useCallback(async () => {
    // Don't attempt to connect if already connected or connecting
    if (isConnected || isConnecting) {
      console.log("Already connected or connecting, skipping connection attempt");
      return isConnected; // Return current connection state
    }
    
    // Simulate connection process with a delay
    try {
      console.log("Starting voice chat connection process");
      setIsConnecting(true);
      // In a real implementation, this would be the actual connection logic
      await new Promise(resolve => setTimeout(resolve, 1500));
      setIsConnected(true);
      console.log("Voice connection established successfully");
      toast.success("Voice connection established");
      return true;
    } catch (error) {
      console.error("Connection error:", error);
      toast.error("Failed to establish voice connection");
      return false;
    } finally {
      setIsConnecting(false);
    }
  }, [isConnected, isConnecting]);

  // Function to disconnect from voice chat
  const disconnectVoiceChat = useCallback(() => {
    if (isConnected) {
      setIsConnected(false);
      console.log("Voice chat disconnected");
      toast.info("Voice chat disconnected");
    }
  }, [isConnected]);

  return {
    isConnected,
    isConnecting,
    setIsConnected,
    setIsConnecting,
    connectVoiceChat,
    disconnectVoiceChat,
    autoConnect
  };
}
