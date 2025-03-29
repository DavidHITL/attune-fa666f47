
import React from "react";
import SessionTimer from "./SessionTimer";
import VoiceCallButton from "./VoiceCallButton";
import EndSessionButton from "./EndSessionButton";

interface ChatHeaderProps {
  sessionStarted: boolean;
  sessionEndTime: number | null;
  onSessionComplete: () => void;
  onVoiceChatOpen: () => void;
  onRequestEndSession: () => void;
}

const ChatHeader: React.FC<ChatHeaderProps> = ({
  sessionStarted,
  sessionEndTime,
  onSessionComplete,
  onVoiceChatOpen,
  onRequestEndSession
}) => {
  return (
    <div className="relative max-w-2xl mx-auto w-full">
      {/* Timer component with session end time */}
      <SessionTimer 
        sessionStarted={sessionStarted}
        sessionEndTime={sessionEndTime}
        onSessionComplete={onSessionComplete}
      />
      
      {/* Phone button in the top-right corner */}
      <div className="absolute top-2 right-0 z-10">
        <VoiceCallButton onClick={onVoiceChatOpen} />
      </div>
      
      {/* End session button appears when session is active */}
      {sessionStarted && (
        <div className="absolute top-2 left-0 z-10">
          <EndSessionButton onClick={onRequestEndSession} />
        </div>
      )}
    </div>
  );
};

export default ChatHeader;
