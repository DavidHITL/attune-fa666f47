
import React, { useState, useEffect } from "react";
import ChatSpeech from "./ChatSpeech";
import ChatConversation from "./ChatConversation";

interface ChatInterfaceProps {
  sessionStarted?: boolean;
  sessionEndTime?: number | null;
}

const ChatInterface: React.FC<ChatInterfaceProps> = ({
  sessionStarted = false,
  sessionEndTime = null
}) => {
  const [isSpeechEnabled, setIsSpeechEnabled] = useState(false);

  // Listen for session timeout event
  useEffect(() => {
    const handleSessionTimeout = (event: CustomEvent) => {
      // Get the closing message
      const message = event.detail?.message;
      if (message && window.addSystemMessage) {
        window.addSystemMessage(message);
      }
    };

    // Add event listener
    document.addEventListener('session-timeout', handleSessionTimeout as EventListener);

    // Cleanup
    return () => {
      document.removeEventListener('session-timeout', handleSessionTimeout as EventListener);
    };
  }, []);

  return (
    <div className="flex flex-col h-full">
      <div className="max-w-2xl mx-auto w-full flex flex-col px-6">
        <ChatSpeech 
          isSpeechEnabled={isSpeechEnabled}
          setIsSpeechEnabled={setIsSpeechEnabled}
        />
      </div>
      <ChatConversation 
        isSpeechEnabled={isSpeechEnabled} 
        sessionStarted={sessionStarted}
        sessionEndTime={sessionEndTime}
      />
    </div>
  );
};

// Declare the global method for TypeScript
declare global {
  interface Window {
    addSystemMessage?: (message: string) => void;
  }
}

export default ChatInterface;
