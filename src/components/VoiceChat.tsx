
import React, { useEffect, useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { X, Phone, Mic, MicOff } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { useVoiceChat } from "@/hooks/useVoiceChat";
import { useSpeechRecognition } from "@/hooks/useSpeechRecognition";
import VoiceVisualization from "./voice/VoiceVisualization";
import VoiceMessageList from "./VoiceMessageList";

interface VoiceChatProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const VoiceChat: React.FC<VoiceChatProps> = ({
  open,
  onOpenChange
}) => {
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

  const {
    isListening,
    transcript: speechTranscript,
    isSupported,
    toggleListening
  } = useSpeechRecognition();

  // Use speech recognition to update transcript
  useEffect(() => {
    if (speechTranscript && open) {
      setTranscript(speechTranscript);
    }
  }, [speechTranscript, open, setTranscript]);

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
  }, [open, connect, disconnect, chatRef]);

  const handleClose = () => {
    if (isListening) {
      toggleListening();
    }
    disconnect();
    onOpenChange(false);
  };

  const handleSendMessage = () => {
    if (transcript.trim()) {
      sendMessage();
      if (isListening) {
        toggleListening(); // Stop listening after sending
        setTimeout(() => {
          toggleListening(); // Start listening again after a short delay
        }, 1000);
      }
    }
  };

  // Determine if the voice assistant is actively speaking
  const isAssistantActive = messages.length > 0 && messages[messages.length - 1].role === 'assistant';

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[500px] max-h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Phone size={18} /> Voice Conversation
          </DialogTitle>
        </DialogHeader>
        
        <div className="flex-1 overflow-y-auto">
          {messages.length > 0 ? (
            <VoiceMessageList messages={messages} transcript={transcript} />
          ) : (
            <div className="flex items-center justify-center p-6">
              <VoiceVisualization isActive={transcript.length > 0 || isAssistantActive || isListening} className="mx-auto" />
            </div>
          )}
        </div>
        
        {transcript && !messages.length && (
          <div className="text-center mb-3 px-4 text-sm text-gray-600">
            {transcript}
          </div>
        )}
        
        <DialogFooter>
          <div className="flex gap-2 items-center justify-between w-full">
            <div className="text-xs text-gray-500">
              {isConnecting ? "Connecting to voice service..." : 
              chatRef.current?.isConnected ? "Voice service connected" : 
              "Voice service disconnected"}
            </div>
            <div className="flex gap-2">
              <Button 
                variant="outline" 
                size="icon" 
                className={`rounded-full ${isListening ? 'bg-red-100 hover:bg-red-200 border-red-300' : 'hover:bg-blue-100 border-blue-300'}`}
                onClick={toggleListening}
                disabled={!isSupported || !chatRef.current?.isConnected}
                title={isListening ? "Stop listening" : "Start listening"}
              >
                {isListening ? <MicOff className="text-red-600" size={20} /> : <Mic className="text-blue-600" size={20} />}
              </Button>
              
              <Button 
                onClick={handleSendMessage} 
                disabled={!transcript.trim() || !chatRef.current?.isConnected}
              >
                Send
              </Button>
              
              <Button variant="outline" onClick={handleClose}>
                <X size={16} className="mr-1" /> Close
              </Button>
            </div>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default VoiceChat;
