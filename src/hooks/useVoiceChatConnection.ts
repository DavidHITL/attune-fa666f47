
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
    if (open && !chatRef.current) {
      setConnectionStatus('connecting');
      connect()
        .then(() => {
          setConnectionStatus('connected');
          toast.success("Voice chat connected");
        })
        .catch((error) => {
          setConnectionStatus('disconnected');
          toast.error("Failed to connect to voice service");
          console.error("Connection error:", error);
        });
    }
    
    return () => {
      if (chatRef.current) {
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
