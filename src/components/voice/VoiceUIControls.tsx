
import React, { useState } from 'react';
import { Loader2 } from "lucide-react";
import { DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import { testWebSocketConnection } from "@/utils/realtime/testWebSocketConnection";

interface VoiceUIControlsProps {
  isConnecting: boolean;
  connectionStatus: 'connecting' | 'connected' | 'disconnected';
}

const VoiceUIControls: React.FC<VoiceUIControlsProps> = ({
  isConnecting,
  connectionStatus
}) => {
  const [isTesting, setIsTesting] = useState(false);
  const { toast } = useToast();
  
  // Check if the browser supports speech recognition
  const isSpeechRecognitionSupported = typeof window !== 'undefined' && 
    ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window);

  // Create unique IDs for accessibility
  const statusId = "voice-connection-status";
  const supportId = "voice-recognition-support";
  
  const handleTestConnection = async () => {
    setIsTesting(true);
    try {
      const result = await testWebSocketConnection();
      if (result.success) {
        toast({
          title: "WebSocket test successful",
          description: "Connection to server established",
        });
        // Close the test connection after 2 seconds
        setTimeout(() => {
          result.close();
        }, 2000);
      } else {
        toast({
          title: "WebSocket test failed",
          description: result.message,
          variant: "destructive"
        });
      }
    } catch (error) {
      toast({
        title: "WebSocket test error",
        description: error instanceof Error ? error.message : String(error),
        variant: "destructive"
      });
    } finally {
      setIsTesting(false);
    }
  };
  
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
        
        <Button
          size="sm"
          variant="outline"
          onClick={handleTestConnection}
          disabled={isTesting || isConnecting}
          className="text-xs"
        >
          {isTesting ? (
            <>
              <Loader2 className="h-3 w-3 animate-spin mr-1" />
              Testing
            </>
          ) : (
            'Test Connection'
          )}
        </Button>
      </div>
    </DialogFooter>
  );
};

export default VoiceUIControls;
