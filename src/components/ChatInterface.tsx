
import React from "react";
import ChatConversation from "./ChatConversation";
import RealtimeChat from "./realtime/RealtimeChat";

interface ChatInterfaceProps {
  sessionStarted?: boolean;
  sessionEndTime?: number | null;
}

const ChatInterface: React.FC<ChatInterfaceProps> = ({
  sessionStarted = false,
  sessionEndTime = null
}) => {
  return (
    <div className="flex flex-col h-full">
      <ChatConversation 
        isSpeechEnabled={false} 
        sessionStarted={sessionStarted}
        sessionEndTime={sessionEndTime}
      />
      
      {/* Only show RealtimeChat when session is started */}
      {sessionStarted && (
        <RealtimeChat
          sessionStarted={sessionStarted}
          sessionEndTime={sessionEndTime}
        />
      )}
    </div>
  );
};

export default ChatInterface;
