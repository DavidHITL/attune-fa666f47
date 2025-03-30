
import React from "react";
import { useVoiceChat } from "@/hooks/useVoiceChat";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import VoiceMessageList from "./VoiceMessageList";
import VoiceInputArea from "./VoiceInputArea";
import { useVoiceChatConnection } from "@/hooks/useVoiceChatConnection";
import { useVoiceChatRecognition } from "@/hooks/useVoiceChatRecognition";
import VoiceConnectionStatus from "./voice/VoiceConnectionStatus";
import VoiceUIControls from "./voice/VoiceUIControls";
import { useAuth } from "@/context/AuthContext";

// Create and export the VoiceChat component
export function VoiceChat({ 
  open, 
  onOpenChange 
}: { 
  open: boolean; 
  onOpenChange: (open: boolean) => void;
}) {
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
    processSpeechInput,
    databaseError,
    retryDatabaseConnection
  } = useVoiceChat(user);

  const {
    transcript: recognitionTranscript,
    isRecording,
    startRecording,
    stopRecording,
  } = useVoiceChatRecognition();

  const { connectionStatus, isConnecting: isConnectionLoading } = useVoiceChatConnection({
    open,
    connect,
    disconnect,
    chatRef
  });

  // Handle speech recognition updates
  React.useEffect(() => {
    if (recognitionTranscript) {
      setTranscript(recognitionTranscript);
    }
  }, [recognitionTranscript, setTranscript]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px] h-[600px] flex flex-col">
        <div className="flex justify-between items-center">
          <h2 className="text-lg font-medium">Voice Conversation</h2>
          <VoiceConnectionStatus status={connectionStatus} />
        </div>

        <VoiceMessageList 
          messages={messages} 
          transcript={transcript}
        />

        <VoiceInputArea
          transcript={transcript}
          setTranscript={setTranscript}
          onSend={sendMessage}
          isRecording={isRecording}
          startRecording={startRecording}
          stopRecording={stopRecording}
        />

        <VoiceUIControls 
          isConnecting={isConnecting || isConnectionLoading} 
          connectionStatus={connectionStatus}
        />
      </DialogContent>
    </Dialog>
  );
}
