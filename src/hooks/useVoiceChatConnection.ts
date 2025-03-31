
import { useState, useEffect, useRef } from "react";
import { DirectOpenAIConnection } from "@/utils/realtime/DirectOpenAIConnection";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

interface UseVoiceChatConnectionProps {
  open: boolean;
  connect: () => Promise<void>;
  disconnect: () => void;
  connectionRef: React.RefObject<DirectOpenAIConnection | null>;
}

export function useVoiceChatConnection({
  open,
  connect,
  disconnect,
  connectionRef
}: UseVoiceChatConnectionProps) {
  const [connectionStatus, setConnectionStatus] = useState<'connecting' | 'connected' | 'disconnected' | 'failed'>('disconnected');
  const [isConnecting, setIsConnecting] = useState(false);
  const hasAttemptedConnection = useRef(false);
  const retryCount = useRef(0);
  const maxRetries = 3;

  // Function to attempt connection
  const attemptDirectConnection = async () => {
    hasAttemptedConnection.current = true;
    setConnectionStatus('connecting');
    setIsConnecting(true);
    
    try {
      // Check for existing session
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        console.warn("[useVoiceChatConnection] No active session found, continuing with connection attempt");
      }
      
      console.log("[useVoiceChatConnection] Attempting direct OpenAI connection");
      await connect();
      setConnectionStatus('connected');
      toast.success("Connected to OpenAI Realtime API");
      retryCount.current = 0; // Reset retry count on successful connection
    } catch (error) {
      console.error("[useVoiceChatConnection] Connection failed:", error);
      setConnectionStatus('failed');
      
      // Show error toast
      toast.error(error instanceof Error ? `Connection failed: ${error.message}` : "Connection failed");
    } finally {
      setIsConnecting(false);
    }
  };
  
  // Function to retry connection
  const retryConnection = () => {
    if (retryCount.current < maxRetries) {
      retryCount.current++;
      hasAttemptedConnection.current = false;
      toast.info(`Retrying connection... (Attempt ${retryCount.current}/${maxRetries})`);
      console.log(`[useVoiceChatConnection] Retry attempt ${retryCount.current}/${maxRetries}`);
    } else {
      toast.error("Maximum retry attempts reached. Please try again later.");
      console.error("[useVoiceChatConnection] Max retry attempts reached");
    }
  };

  // Handle connection
  useEffect(() => {
    if (open && !hasAttemptedConnection.current) {
      attemptDirectConnection();
    }
    
    // Cleanup on dialog close
    return () => {
      if (!open) {
        disconnect();
        setConnectionStatus('disconnected');
        hasAttemptedConnection.current = false;
        retryCount.current = 0; // Reset retry count when closing
        console.log("[useVoiceChatConnection] Dialog closed, connection clean up");
      }
    };
  }, [open, connect, disconnect, hasAttemptedConnection.current]);
  
  // Check connection status periodically
  useEffect(() => {
    if (!open) return;
    
    const checkInterval = setInterval(() => {
      if (connectionStatus === 'connected' && connectionRef.current) {
        const isConnected = connectionRef.current.isConnectedToOpenAI();
        console.log("[useVoiceChatConnection] Connection check:", isConnected);
        
        if (!isConnected) {
          setConnectionStatus('disconnected');
          toast.error("Connection to voice service was lost");
          
          // Try to reconnect
          hasAttemptedConnection.current = false;
        }
      }
    }, 5000);
    
    return () => clearInterval(checkInterval);
  }, [connectionStatus, open, connectionRef]);

  return {
    connectionStatus,
    isConnecting,
    retryConnection
  };
}
