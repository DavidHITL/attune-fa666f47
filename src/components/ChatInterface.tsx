
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
  // Listen for session timeout event
  React.useEffect(() => {
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
      <ChatConversation 
        isSpeechEnabled={false} 
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
