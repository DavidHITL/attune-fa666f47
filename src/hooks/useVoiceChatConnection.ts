
import { useState, useEffect } from 'react';
import { toast } from "sonner";
import { ChatError } from "@/utils/realtime/types";

export type ConnectionStatus = 'connecting' | 'connected' | 'disconnected';

interface UseVoiceChatConnectionProps {
  open: boolean;
  connect: () => Promise<void>;
  disconnect: () => void;
  chatRef: React.MutableRefObject<any>;
}

export function useVoiceChatConnection({
  open,
  connect,
  disconnect,
  chatRef
}: UseVoiceChatConnectionProps) {
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>('disconnected');
  
  // Handle connection to voice API
  useEffect(() => {
    console.log("[useVoiceChatConnection] Dialog open:", open, "Chat ref exists:", !!chatRef.current, 
               "Connection status:", connectionStatus);
    
    if (open && !chatRef.current) {
      setConnectionStatus('connecting');
      console.log("[useVoiceChatConnection] Initiating connection");
      
      connect()
        .then(() => {
          console.log("[useVoiceChatConnection] Connection successful");
          setConnectionStatus('connected');
          toast.success("Voice chat connected");
        })
        .catch((error) => {
          console.error("[useVoiceChatConnection] Connection failed:", error);
          setConnectionStatus('disconnected');
          toast.error("Failed to connect to voice service");
        });
    }
    
    return () => {
      if (chatRef.current) {
        console.log("[useVoiceChatConnection] Cleaning up connection");
        disconnect();
        setConnectionStatus('disconnected');
      }
    };
  }, [open, connect, disconnect, chatRef]);

  return {
    connectionStatus,
    setConnectionStatus
  };
}
