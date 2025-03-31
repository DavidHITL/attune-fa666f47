
import React from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogTrigger } from "@/components/ui/dialog";
import { useAuth } from "@/context/AuthContext";
import { formatDistanceToNow } from "date-fns";
import { CircleEllipsis } from "lucide-react";

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
  const { user } = useAuth();
  const userEmail = user?.email || "Guest";
  const shortenedEmail = userEmail.length > 20 
    ? `${userEmail.substring(0, 20)}...` 
    : userEmail;

  return (
    <header className="bg-white border-b border-gray-200">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center py-3">
          <div className="flex items-center space-x-2">
            <h1 className="text-lg font-medium hidden md:block">
              Chat with AI
            </h1>
            {sessionStarted && (
              <span className="text-sm text-gray-500 hidden sm:inline-block">
                Session started {" "}
                {formatDistanceToNow(new Date(), { addSuffix: true })}
              </span>
            )}
            {sessionEndTime && onSessionComplete && (
              <div className="flex items-center gap-2">
                <span className="text-sm text-red-600">
                  Session ending in{" "}
                  {formatDistanceToNow(sessionEndTime)}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  className="text-xs"
                  onClick={onSessionComplete}
                >
                  End Now
                </Button>
              </div>
            )}
          </div>

          <div className="flex items-center">
            <div className="flex items-center">
              <span className="text-sm text-gray-600 mr-2 hidden sm:block">
                {shortenedEmail}
              </span>
              
              <Dialog>
                <DialogTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="rounded-full"
                    onClick={() => {}}
                  >
                    <CircleEllipsis className="h-5 w-5" />
                  </Button>
                </DialogTrigger>
              </Dialog>
            </div>
            
            {sessionStarted && onRequestEndSession && (
              <Button
                variant="outline"
                size="sm"
                onClick={onRequestEndSession}
                className="ml-2 hidden sm:inline-flex"
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
