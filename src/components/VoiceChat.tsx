
import React, { useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle
} from "@/components/ui/dialog";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import VoiceVisualization from "./voice/VoiceVisualization";
import { useVoiceChatRecognition } from "@/hooks/useVoiceChatRecognition";

interface VoiceChatProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const VoiceChat: React.FC<VoiceChatProps> = ({ open, onOpenChange }) => {
  const { user } = useAuth();
  const { 
    isRecording, 
    startRecording, 
    stopRecording 
  } = useVoiceChatRecognition();

  // Start recording when opened
  useEffect(() => {
    if (open && user) {
      console.log("[VoiceChat] Dialog opened, starting recording");
      startRecording();
    }
    
    return () => {
      if (isRecording) {
        console.log("[VoiceChat] Dialog closed, stopping recording");
        stopRecording();
      }
    };
  }, [open, user, isRecording, startRecording, stopRecording]);

  const handleClose = () => {
    stopRecording();
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-md mx-auto">
        <DialogHeader>
          <DialogTitle className="text-center">Voice Chat</DialogTitle>
        </DialogHeader>
        
        <div className="flex flex-col items-center justify-center h-[60vh] gap-6">
          <VoiceVisualization isActive={isRecording} />
          
          <Button 
            onClick={handleClose}
            size="lg"
            className="mt-4"
          >
            Switch Back to Text
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default VoiceChat;
