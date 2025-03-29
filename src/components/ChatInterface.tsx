
import React, { useState } from "react";
import ChatSpeech from "./ChatSpeech";
import ChatConversation from "./ChatConversation";

const ChatInterface: React.FC = () => {
  const [isSpeechEnabled, setIsSpeechEnabled] = useState(false);

  return (
    <div className="flex flex-col h-full">
      <div className="max-w-2xl mx-auto w-full flex flex-col">
        <ChatSpeech 
          isSpeechEnabled={isSpeechEnabled}
          setIsSpeechEnabled={setIsSpeechEnabled}
        />
      </div>
      <ChatConversation isSpeechEnabled={isSpeechEnabled} />
    </div>
  );
};

export default ChatInterface;
