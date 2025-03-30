
import React, { useState, useEffect, useCallback } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle
} from "@/components/ui/dialog";
import { useAuth } from "@/context/AuthContext";
import { useVoiceChat } from "@/hooks/useVoiceChat";
import { useVoiceChatConnection } from "@/hooks/useVoiceChatConnection";
import VoiceInputArea from "./VoiceInputArea";
import VoiceMessageList from "./VoiceMessageList";
import VoiceUIControls from "./voice/VoiceUIControls";

interface VoiceChatProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const VoiceChat: React.FC<VoiceChatProps> = ({ open, onOpenChange }) => {
  const { user } = useAuth();
  const [isInitialized, setIsInitialized] = useState(false);

  const {
    isConnecting,
    transcript,
    setTranscript,
    messages,
    chatRef,
    connect,
    disconnect,
    sendMessage,
    processSpeechInput,
    databaseError,
    retryDatabaseConnection
  } = useVoiceChat(user);

  const { connectionStatus, setConnectionStatus } = useVoiceChatConnection({
    open,
    connect,
    disconnect,
    chatRef
  });

  // Debug logs for connection status
  useEffect(() => {
    console.log("[VoiceChat] Connection status:", connectionStatus);
    console.log("[VoiceChat] chatRef.current exists:", !!chatRef.current);
    console.log("[VoiceChat] isConnecting:", isConnecting);
  }, [connectionStatus, chatRef.current, isConnecting]);
  
  // Handle dialog close
  const handleOpenChange = useCallback((isOpen: boolean) => {
    console.log("[VoiceChat] Dialog open state changing to:", isOpen);
    if (!isOpen) {
      disconnect();
      setConnectionStatus('disconnected');
    }
    onOpenChange(isOpen);
  }, [disconnect, onOpenChange, setConnectionStatus]);

  // Initialize once
  useEffect(() => {
    setIsInitialized(true);
    return () => {
      disconnect();
    };
  }, []);

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-md mx-auto">
        <DialogHeader>
          <DialogTitle>Voice Chat</DialogTitle>
          <DialogDescription>
            Speak with the AI using your microphone
          </DialogDescription>
        </DialogHeader>
        
        <div className="flex flex-col h-[60vh]">
          <VoiceMessageList messages={messages} />
          
          <VoiceInputArea
            transcript={transcript}
            onSendMessage={sendMessage}
            onAudioData={processSpeechInput}
            connectionStatus={connectionStatus}
            isConnecting={isConnecting}
          />
        </div>
        
        <VoiceUIControls 
          isConnecting={isConnecting}
          connectionStatus={connectionStatus}
        />
      </DialogContent>
    </Dialog>
  );
};

export default VoiceChat;
