
import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Phone } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { useVoiceChat } from "@/hooks/useVoiceChat";
import { useSpeechRecognition } from "@/hooks/useSpeechRecognition";
import { useVoiceChatConnection } from "@/hooks/useVoiceChatConnection";
import { useSpeechToText } from "@/hooks/useSpeechToText";
import { useAutoSendMessage } from "@/hooks/useAutoSendMessage";
import VoiceConnectionStatus from "./voice/VoiceConnectionStatus";
import VoiceUIControls from "./voice/VoiceUIControls";
import VoiceVisualization from "./voice/VoiceVisualization";
import VoiceMessageList from "./VoiceMessageList";
import DatabaseConnectionAlert from "./chat/DatabaseConnectionAlert";

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
    sendMessage,
    databaseError,
    retryDatabaseConnection
  } = useVoiceChat(user);

  const {
    isListening,
    transcript: speechTranscript,
    isSupported,
    toggleListening
  } = useSpeechRecognition();
  
  // Use custom hooks for voice chat functionality
  const { connectionStatus } = useVoiceChatConnection({
    open,
    connect,
    disconnect,
    chatRef
  });
  
  useSpeechToText({
    open,
    isSupported,
    isListening,
    toggleListening
  });
  
  useAutoSendMessage({
    transcript,
    open,
    sendMessage
  });

  // Use speech recognition to update transcript
  useEffect(() => {
    if (speechTranscript && open) {
      setTranscript(speechTranscript);
    }
  }, [speechTranscript, open, setTranscript]);

  const handleClose = () => {
    if (isListening) {
      toggleListening();
    }
    disconnect();
    onOpenChange(false);
  };

  // Determine if the voice assistant is actively speaking
  const isAssistantActive = messages.length > 0 && messages[messages.length - 1].role === 'assistant';

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[500px] max-h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Phone size={18} /> Voice Conversation
            </div>
            <VoiceConnectionStatus status={connectionStatus} />
          </DialogTitle>
        </DialogHeader>
        
        {databaseError && (
          <DatabaseConnectionAlert onRetryConnection={retryDatabaseConnection} />
        )}
        
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
        
        <VoiceUIControls
          isConnecting={isConnecting}
          connectionStatus={connectionStatus}
        />
      </DialogContent>
    </Dialog>
  );
};

export default VoiceChat;
