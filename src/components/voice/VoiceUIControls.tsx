
import React from 'react';
import { DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

interface VoiceUIControlsProps {
  isConnecting: boolean;
  connectionStatus: 'connecting' | 'connected' | 'disconnected';
}

const VoiceUIControls: React.FC<VoiceUIControlsProps> = ({
  isConnecting,
  connectionStatus
}) => {
  // Check if the browser supports speech recognition
  const isSpeechRecognitionSupported = typeof window !== 'undefined' && 
    ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window);

  // Create unique IDs for accessibility
  const statusId = "voice-connection-status";
  const supportId = "voice-recognition-support";
  
  return (
    <DialogFooter>
      <div className="flex gap-2 items-center justify-between w-full">
        <div className="text-xs text-gray-500">
          {!isSpeechRecognitionSupported && (
            <p id={supportId} className="text-amber-500">
              Your browser does not support speech recognition.
            </p>
          )}
          <p id={statusId} className="text-gray-500">
            {connectionStatus === 'connected' ? 'Connected to AI voice service' : 
             connectionStatus === 'connecting' ? 'Establishing connection...' :
             'Not connected'}
          </p>
        </div>
      </div>
    </DialogFooter>
  );
};

export default VoiceUIControls;
