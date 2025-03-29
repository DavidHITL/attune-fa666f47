
import { useState, useEffect } from 'react';

interface UseSpeechToTextProps {
  open: boolean;
  isSupported: boolean;
  isListening: boolean;
  toggleListening: () => void;
}

export function useSpeechToText({
  open,
  isSupported,
  isListening,
  toggleListening
}: UseSpeechToTextProps) {
  // Start listening when the dialog opens
  useEffect(() => {
    if (open && isSupported && !isListening) {
      setTimeout(() => {
        toggleListening();
      }, 500);
    }
    
    return () => {
      if (isListening) {
        toggleListening();
      }
    };
  }, [open, isSupported, isListening, toggleListening]);

  return {
    isListening
  };
}
