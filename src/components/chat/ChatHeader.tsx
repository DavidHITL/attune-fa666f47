
import React from "react";
import { Button } from "@/components/ui/button";
import { PhoneCall } from "lucide-react";
import Timer from "@/components/Timer";

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
      <Timer 
        initialMinutes={25} 
        initialSeconds={0} 
        isRunning={sessionStarted}
        onComplete={onSessionComplete}
        sessionEndTime={sessionEndTime || undefined}
      />
      
      {/* Phone button in the top-right corner */}
      <div className="absolute top-2 right-0 z-10">
        <Button 
          variant="outline" 
          size="icon" 
          className="rounded-full hover:bg-blue-100 border-blue-200"
          onClick={onVoiceChatOpen}
          title="Start voice conversation"
        >
          <PhoneCall className="text-blue-600" size={20} />
        </Button>
      </div>
      
      {/* End session button appears when session is active */}
      {sessionStarted && (
        <div className="absolute top-2 left-0 z-10">
          <Button
            variant="outline"
            size="sm"
            className="border-gray-200 text-black hover:bg-gray-50"
            onClick={onRequestEndSession}
          >
            End Session
          </Button>
        </div>
      )}
    </div>
  );
};

export default ChatHeader;
