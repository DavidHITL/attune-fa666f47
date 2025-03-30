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
  const isSpeechRecognitionSupported = typeof window !== 'undefined' && ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window);

  // Create unique IDs for accessibility
  const statusId = "voice-connection-status";
  const supportId = "voice-recognition-support";
  return <DialogFooter>
      <div className="flex gap-2 items-center justify-between w-full">
        
        
      </div>
    </DialogFooter>;
};
export default VoiceUIControls;