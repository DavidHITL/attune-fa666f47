
import React from "react";
import { Button } from "@/components/ui/button";
import SessionTimer from "./SessionTimer";

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
  return (
    <header className="bg-white border-b border-gray-200">
      <div className="container mx-auto px-4">
        <div className="flex justify-between items-center py-3">
          <div className="flex-1">
            <h1 className="text-lg font-medium">
              Chat with AI
            </h1>
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
        </div>
      </div>
    </header>
  );
};

export default ChatHeader;
