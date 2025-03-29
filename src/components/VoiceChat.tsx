
import React, { useEffect, useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Phone, Wifi, WifiOff } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { useVoiceChat } from "@/hooks/useVoiceChat";
import { useSpeechRecognition } from "@/hooks/useSpeechRecognition";
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
  
  const [connectionStatus, setConnectionStatus] = useState<'connecting' | 'connected' | 'disconnected'>('disconnected');

  // Use speech recognition to update transcript
  useEffect(() => {
    if (speechTranscript && open) {
      setTranscript(speechTranscript);
    }
  }, [speechTranscript, open, setTranscript]);

  // Handle connection to voice API
  useEffect(() => {
    if (open && !chatRef.current) {
      setConnectionStatus('connecting');
      connect().then(() => {
        setConnectionStatus('connected');
      }).catch(() => {
        setConnectionStatus('disconnected');
      });
    }
    return () => {
      if (chatRef.current) {
        disconnect();
        setConnectionStatus('disconnected');
      }
    };
  }, [open, connect, disconnect, chatRef]);

  // Start listening when the dialog opens
  useEffect(() => {
    if (open && isSupported && !isListening) {
      setTimeout(() => {
        toggleListening();
      }, 500);
    }
    return () => {
      if (isListening) {
        toggleListening();
      }
    };
  }, [open, isSupported, isListening, toggleListening]);

  const handleClose = () => {
    if (isListening) {
      toggleListening();
    }
    disconnect();
    onOpenChange(false);
  };

  // Auto-send message when there's a pause in speaking
  useEffect(() => {
    if (!transcript.trim() || !open) return;
    
    const timer = setTimeout(() => {
      sendMessage();
    }, 2000);
    
    return () => clearTimeout(timer);
  }, [transcript, open, sendMessage]);

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
            <div className="text-xs flex items-center gap-1">
              {connectionStatus === 'connected' && (
                <>
                  <Wifi size={14} className="text-green-500" />
                  <span className="text-green-500">Connected</span>
                </>
              )}
              {connectionStatus === 'connecting' && (
                <span className="text-amber-500">Connecting...</span>
              )}
              {connectionStatus === 'disconnected' && (
                <>
                  <WifiOff size={14} className="text-red-500" />
                  <span className="text-red-500">Disconnected</span>
                </>
              )}
            </div>
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
        
        <DialogFooter>
          <div className="flex gap-2 items-center justify-between w-full">
            <div className="text-xs text-gray-500">
              {isConnecting ? "Connecting to voice service..." : 
              connectionStatus === 'connected' ? "Voice service connected" : 
              "Voice service disconnected"}
            </div>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default VoiceChat;
