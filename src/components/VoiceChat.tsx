
import React, { useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle
} from "@/components/ui/dialog";
import { useAuth } from "@/context/AuthContext";
import VoiceInputArea from "./VoiceInputArea";
import VoiceMessageList from "./VoiceMessageList";
import VoiceUIControls from "./voice/VoiceUIControls";
import { useVoiceChatRecognition } from "@/hooks/useVoiceChatRecognition";
import { useVoiceChatMessages } from "@/hooks/useVoiceChatMessages";

interface VoiceChatProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const VoiceChat: React.FC<VoiceChatProps> = ({ open, onOpenChange }) => {
  const { user } = useAuth();
  const { 
    transcript, 
    setTranscript, 
    isRecording, 
    startRecording, 
    stopRecording 
  } = useVoiceChatRecognition();
  
  const {
    messages,
    isProcessing,
    loadMessages,
    sendMessage
  } = useVoiceChatMessages();

  // Load previous messages when opened
  useEffect(() => {
    if (open && user) {
      console.log("[VoiceChat] Dialog opened, loading messages");
      loadMessages();
    }
  }, [open, user, loadMessages]);

  const handleSendMessage = async () => {
    await sendMessage(transcript);
    setTranscript("");
  };

  const handleClose = () => {
    stopRecording();
    setTranscript("");
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-md mx-auto">
        <DialogHeader>
          <DialogTitle>Voice Chat</DialogTitle>
          <DialogDescription>
            Speak with the AI using your microphone
          </DialogDescription>
        </DialogHeader>
        
        <div className="flex flex-col h-[60vh]">
          <VoiceMessageList 
            messages={messages} 
            transcript={transcript} 
          />
          
          <VoiceInputArea
            transcript={transcript}
            setTranscript={setTranscript}
            onSend={handleSendMessage}
            isRecording={isRecording}
            startRecording={startRecording}
            stopRecording={stopRecording}
          />
        </div>
        
        <VoiceUIControls 
          isConnecting={isProcessing}
          connectionStatus={isProcessing ? 'connecting' : 'connected'}
        />
      </DialogContent>
    </Dialog>
  );
};

export default VoiceChat;
