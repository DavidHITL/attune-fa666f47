
import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Phone } from "lucide-react";
import SessionTimer from "./SessionTimer";
import CallModal from "./CallModal";

interface ChatHeaderProps {
  sessionStarted?: boolean;
  sessionEndTime?: Date | null;
  onSessionComplete?: () => void;
  onRequestEndSession?: () => void;
}

const ChatHeader: React.FC<ChatHeaderProps> = ({
  sessionStarted,
  sessionEndTime,
  onSessionComplete,
  onRequestEndSession
}) => {
  const [showCallModal, setShowCallModal] = useState(false);
  
  const sessionEndTimeMs = sessionEndTime ? sessionEndTime.getTime() : null;
  
  const handleVoiceCallClick = () => {
    console.log("Voice call button clicked, opening modal");
    setShowCallModal(true);
  };

  return (
    <header className="bg-white border-b border-gray-200">
      <div className="container mx-auto px-4">
        <div className="flex justify-between items-center py-3">
          <div className="flex-1">
            {sessionStarted && onRequestEndSession && (
              <Button
                variant="outline"
                size="sm"
                onClick={onRequestEndSession}
                className="ml-2"
              >
                End Session
              </Button>
            )}
          </div>
          
          <div className="flex-1 text-center">
            {sessionStarted && sessionEndTime && onSessionComplete && (
              <SessionTimer 
                sessionStarted={sessionStarted}
                sessionEndTime={sessionEndTime.getTime()}
                onSessionComplete={onSessionComplete}
              />
            )}
          </div>

          <div className="flex-1 flex justify-end">
            {sessionStarted && (
              <Button
                variant="ghost"
                size="icon"
                className="rounded-full"
                onClick={handleVoiceCallClick}
              >
                <Phone className="h-5 w-5" />
                <span className="sr-only">Call</span>
              </Button>
            )}
          </div>
        </div>
      </div>

      <CallModal 
        open={showCallModal} 
        onOpenChange={setShowCallModal} 
        sessionStarted={sessionStarted}
        sessionEndTime={sessionEndTimeMs}
      />
    </header>
  );
};

export default ChatHeader;
