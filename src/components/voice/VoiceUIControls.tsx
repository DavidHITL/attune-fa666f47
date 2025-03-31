
import React from 'react';
import { DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { AlertCircle, RefreshCw } from "lucide-react";

interface VoiceUIControlsProps {
  isConnecting: boolean;
  connectionStatus: 'connecting' | 'connected' | 'disconnected' | 'failed';
  onRetry?: () => void;
}

const VoiceUIControls: React.FC<VoiceUIControlsProps> = ({
  isConnecting,
  connectionStatus,
  onRetry
}) => {
  // Check if the browser supports speech recognition
  const isSpeechRecognitionSupported = typeof window !== 'undefined' && 
    ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window);

  // Create unique IDs for accessibility
  const statusId = "voice-connection-status";
  const supportId = "voice-recognition-support";
  
  return (
    <DialogFooter className="flex-col space-y-3">
      <div className="flex gap-2 items-center justify-between w-full">
        <div className="text-xs text-gray-500">
          {!isSpeechRecognitionSupported && (
            <p id={supportId} className="text-amber-500">
              Your browser does not support speech recognition.
            </p>
          )}
          <p id={statusId} className={`${connectionStatus === 'failed' ? 'text-red-500' : 'text-gray-500'}`}>
            {connectionStatus === 'connected' ? 'Connected to AI voice service' : 
             connectionStatus === 'connecting' ? 'Establishing connection...' :
             connectionStatus === 'failed' ? 'Connection failed' :
             'Not connected'}
          </p>
        </div>
      </div>
      
      {connectionStatus === 'failed' && onRetry && (
        <Button 
          onClick={onRetry}
          variant="outline"
          className="flex items-center gap-2 w-full"
          type="button"
        >
          <RefreshCw className="h-4 w-4" />
          <span>Retry Connection</span>
        </Button>
      )}
    </DialogFooter>
  );
};

export default VoiceUIControls;
