
import React, { useState } from "react";
import NavBar from "@/components/NavBar";
import ChatInterface from "@/components/ChatInterface";
import VoiceChat from "@/components/VoiceChat";
import SessionStartModal from "@/components/chat/SessionStartModal";
import EndSessionDialog from "@/components/chat/EndSessionDialog";
import ChatHeader from "@/components/chat/ChatHeader";
import { useSessionManager } from "@/hooks/useSessionManager";

const Chat: React.FC = () => {
  const [voiceChatOpen, setVoiceChatOpen] = useState(false);
  
  const {
    sessionStarted,
    sessionEndTime,
    showStartModal,
    setShowStartModal,
    showEndConfirmation,
    setShowEndConfirmation,
    startSession,
    handleRequestEndSession,
    confirmEndSession
  } = useSessionManager();

  const handlePhoneClick = () => {
    setVoiceChatOpen(true);
  };

  return (
    <div className="flex flex-col h-screen">
      <NavBar />
      
      <ChatHeader 
        sessionStarted={sessionStarted}
        sessionEndTime={sessionEndTime}
        onSessionComplete={confirmEndSession}
        onVoiceChatOpen={handlePhoneClick}
        onRequestEndSession={handleRequestEndSession}
      />
      
      <div className="relative flex-1 overflow-hidden bg-apple-gray-6">
        <div className="h-full overflow-auto pb-6">
          <ChatInterface 
            sessionStarted={sessionStarted}
            sessionEndTime={sessionEndTime}
          />
        </div>
      </div>
      
      <VoiceChat 
        open={voiceChatOpen} 
        onOpenChange={setVoiceChatOpen} 
      />
      
      {/* Session Modals */}
      <SessionStartModal 
        open={showStartModal && !sessionStarted}
        onOpenChange={setShowStartModal}
        onStartSession={startSession}
      />
      
      <EndSessionDialog 
        open={showEndConfirmation}
        onOpenChange={setShowEndConfirmation}
        onConfirmEnd={confirmEndSession}
      />
    </div>
  );
};

export default Chat;
