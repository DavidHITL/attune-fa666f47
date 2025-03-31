
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
  const [connectionStatus, setConnectionStatus] = useState<'connecting' | 'connected' | 'disconnected'>('disconnected');
  const [isConnecting, setIsConnecting] = useState(false);
  const hasAttemptedConnection = useRef(false);
  const retryCount = useRef(0);
  const maxRetries = 3;

  // Handle connection
  useEffect(() => {
    if (open && !hasAttemptedConnection.current) {
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
          
          await connect();
          setConnectionStatus('connected');
          toast.success("Connected to OpenAI Realtime API");
          retryCount.current = 0; // Reset retry count on successful connection
        } catch (error) {
          console.error("[useVoiceChatConnection] Connection failed:", error);
          setConnectionStatus('disconnected');
          
          // Implement retry logic
          if (retryCount.current < maxRetries) {
            retryCount.current++;
            toast.error(`Connection attempt ${retryCount.current} failed. Retrying...`);
            
            // Wait and retry
            setTimeout(async () => {
              hasAttemptedConnection.current = false; // Allow another attempt
            }, 2000);
          } else {
            toast.error("Could not connect after multiple attempts. Please try again later.");
          }
        } finally {
          setIsConnecting(false);
        }
      };
      
      attemptDirectConnection();
    }
    
    // Cleanup on dialog close
    return () => {
      if (!open) {
        disconnect();
        setConnectionStatus('disconnected');
        hasAttemptedConnection.current = false;
      }
    };
  }, [open, connect, disconnect]);
  
  // Check connection status periodically
  useEffect(() => {
    if (!open) return;
    
    const checkInterval = setInterval(() => {
      if (connectionStatus === 'connected' && connectionRef.current) {
        if (!connectionRef.current.isConnectedToOpenAI()) {
          setConnectionStatus('disconnected');
          toast.error("Connection to voice service was lost");
          
          // Try to reconnect
          try {
            hasAttemptedConnection.current = false;
          } catch (error) {
            console.error("[useVoiceChatConnection] Reconnection failed:", error);
          }
        }
      }
    }, 5000);
    
    return () => clearInterval(checkInterval);
  }, [connectionStatus, open, connectionRef]);

  return {
    connectionStatus,
    isConnecting
  };
}
