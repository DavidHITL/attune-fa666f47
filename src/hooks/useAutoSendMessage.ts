
import { useEffect } from 'react';

interface UseAutoSendMessageProps {
  transcript: string;
  open: boolean;
  sendMessage: () => void;
}

export function useAutoSendMessage({
  transcript,
  open,
  sendMessage
}: UseAutoSendMessageProps) {
  // Auto-send message when there's a pause in speaking
  useEffect(() => {
    if (!transcript.trim() || !open) return;
    
    const timer = setTimeout(() => {
      sendMessage();
    }, 2000);
    
    return () => clearTimeout(timer);
  }, [transcript, open, sendMessage]);
}
