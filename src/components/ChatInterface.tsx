
import React from "react";
import ChatConversation from "./ChatConversation";

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
    </div>
  );
};

export default ChatInterface;
