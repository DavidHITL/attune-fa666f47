
import React, { useEffect } from 'react';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogClose
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { X, Phone, Mic } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { useVoiceChat } from "@/hooks/useVoiceChat";
import VoiceVisualization from "./voice/VoiceVisualization";

interface VoiceChatProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const VoiceChat: React.FC<VoiceChatProps> = ({ open, onOpenChange }) => {
  const { user } = useAuth();
  const {
    isConnecting,
    transcript,
    setTranscript,
    messages,
    chatRef,
    connect,
    disconnect,
    sendMessage
  } = useVoiceChat(user);

  // Handle connection to voice API
  useEffect(() => {
    if (open && !chatRef.current) {
      connect();
    }
    
    return () => {
      if (chatRef.current) {
        disconnect();
      }
    };
  }, [open]);

  const handleClose = () => {
    disconnect();
    onOpenChange(false);
  };

  // Determine if the voice assistant is actively speaking
  const isAssistantActive = messages.length > 0 && 
                            messages[messages.length-1].role === 'assistant';

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px] max-h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Phone size={18} /> Voice Conversation
          </DialogTitle>
        </DialogHeader>
        
        <div className="flex-1 flex items-center justify-center p-6">
          <VoiceVisualization 
            isActive={transcript.length > 0 || isAssistantActive} 
            className="mx-auto"
          />
        </div>
        
        {transcript && (
          <div className="text-center mb-3 px-4 text-sm text-gray-600">
            {transcript}
          </div>
        )}
        
        <DialogFooter>
          <div className="flex gap-2 items-center justify-between w-full">
            <div className="text-xs text-gray-500">
              {isConnecting 
                ? "Connecting to voice service..." 
                : chatRef.current?.isConnected 
                  ? "Voice service connected" 
                  : "Voice service disconnected"}
            </div>
            <div className="flex gap-2">
              <DialogClose asChild>
                <Button variant="outline" size="sm" onClick={handleClose}>
                  <X size={16} className="mr-1" /> Close
                </Button>
              </DialogClose>
            </div>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default VoiceChat;
