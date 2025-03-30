
import React from 'react';
import { Loader2 } from "lucide-react";
import { DialogFooter } from "@/components/ui/dialog";

interface VoiceUIControlsProps {
  isConnecting: boolean;
  connectionStatus: 'connecting' | 'connected' | 'disconnected';
}

const VoiceUIControls: React.FC<VoiceUIControlsProps> = ({ 
  isConnecting, 
  connectionStatus 
}) => {
  // Check if the browser supports speech recognition
  const isSpeechRecognitionSupported = 
    typeof window !== 'undefined' && 
    ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window);

  // Create unique IDs for accessibility
  const statusId = "voice-connection-status";
  const supportId = "voice-recognition-support";

  return (
    <DialogFooter>
      <div className="flex gap-2 items-center justify-between w-full">
        <div 
          id={statusId}
          className="text-xs text-gray-500 flex items-center"
          aria-live="polite"
        >
          {isConnecting && <Loader2 className="w-3 h-3 mr-2 animate-spin" />}
          {isConnecting ? "Processing..." : 
           connectionStatus === 'connected' ? "Ready" : 
           "Disconnected"}
        </div>
        <div 
          id={supportId}
          className="text-xs text-blue-500"
        >
          {isSpeechRecognitionSupported ? "Voice recognition available" : "Voice recognition not supported"}
        </div>
      </div>
    </DialogFooter>
  );
};

export default VoiceUIControls;
