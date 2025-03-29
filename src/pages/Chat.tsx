
import React, { useState, useEffect } from "react";
import NavBar from "@/components/NavBar";
import Timer from "@/components/Timer";
import ChatInterface from "@/components/ChatInterface";
import { Button } from "@/components/ui/button";
import { PhoneCall } from "lucide-react";
import VoiceChat from "@/components/VoiceChat";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle,
  DialogDescription,
  DialogFooter
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { toast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";

const SESSION_DURATION_MS = 25 * 60 * 1000; // 25 minutes in milliseconds

const Chat: React.FC = () => {
  const [voiceChatOpen, setVoiceChatOpen] = useState(false);
  const [sessionStarted, setSessionStarted] = useState(false);
  const [sessionEndTime, setSessionEndTime] = useState<number | null>(null);
  const [showStartModal, setShowStartModal] = useState(true);
  const [showEndConfirmation, setShowEndConfirmation] = useState(false);
  const navigate = useNavigate();

  const handlePhoneClick = () => {
    setVoiceChatOpen(true);
  };

  const startSession = () => {
    const endTime = Date.now() + SESSION_DURATION_MS;
    setSessionStarted(true);
    setSessionEndTime(endTime);
    setShowStartModal(false);
    
    // Save session state to localStorage
    localStorage.setItem('sessionActive', 'true');
    localStorage.setItem('sessionEndTime', endTime.toString());
    
    toast({
      title: "Session started",
      description: "Your 25-minute therapeutic session has begun."
    });
  };

  const handleSessionComplete = () => {
    setSessionStarted(false);
    setSessionEndTime(null);
    
    // Clear session data
    localStorage.removeItem('sessionActive');
    localStorage.removeItem('sessionEndTime');
    
    toast({
      title: "Session ended",
      description: "Your therapeutic session has ended. Thank you for participating.",
      variant: "default"
    });
    
    // Add session closing message to the chat
    const event = new CustomEvent('session-timeout', {
      detail: {
        message: "Our 25-minute session has ended. I hope our conversation was helpful. Remember to practice what we discussed, and I'll be here next time you'd like to talk."
      }
    });
    document.dispatchEvent(event);
  };

  const handleRequestEndSession = () => {
    setShowEndConfirmation(true);
  };

  const confirmEndSession = () => {
    setSessionStarted(false);
    setSessionEndTime(null);
    setShowEndConfirmation(false);
    
    // Clear session data
    localStorage.removeItem('sessionActive');
    localStorage.removeItem('sessionEndTime');
    
    toast({
      title: "Session ended early",
      description: "Your session has been ended. Feel free to start a new one when you're ready."
    });
  };

  // Check for active session on component mount
  useEffect(() => {
    const sessionActive = localStorage.getItem('sessionActive') === 'true';
    const storedEndTime = localStorage.getItem('sessionEndTime');
    
    if (sessionActive && storedEndTime) {
      const endTime = parseInt(storedEndTime, 10);
      const now = Date.now();
      
      if (endTime > now) {
        // Session is still active
        setSessionStarted(true);
        setSessionEndTime(endTime);
        setShowStartModal(false);
      } else {
        // Session has expired while away
        handleSessionComplete();
      }
    }
  }, []);
  
  // Check if session has expired
  useEffect(() => {
    if (sessionEndTime) {
      const checkExpiration = () => {
        const now = Date.now();
        if (now >= sessionEndTime) {
          handleSessionComplete();
        }
      };
      
      // Check immediately
      checkExpiration();
      
      // Set up interval to check periodically
      const interval = setInterval(checkExpiration, 1000);
      return () => clearInterval(interval);
    }
  }, [sessionEndTime]);

  return (
    <div className="flex flex-col h-screen">
      <NavBar />
      
      {/* Timer component with session end time */}
      <Timer 
        initialMinutes={25} 
        initialSeconds={0} 
        isRunning={sessionStarted}
        onComplete={handleSessionComplete}
        sessionEndTime={sessionEndTime || undefined}
      />
      
      <div className="relative flex-1 overflow-hidden">
        {/* Phone button in the top-right corner */}
        <div className="absolute top-2 right-2 z-10">
          <Button 
            variant="outline" 
            size="icon" 
            className="rounded-full hover:bg-blue-100 border-blue-200"
            onClick={handlePhoneClick}
            title="Start voice conversation"
          >
            <PhoneCall className="text-blue-600" size={20} />
          </Button>
        </div>
        
        {/* End session button appears when session is active */}
        {sessionStarted && (
          <div className="absolute top-2 left-2 z-10">
            <Button
              variant="outline"
              size="sm"
              className="border-red-200 text-red-600 hover:bg-red-50"
              onClick={handleRequestEndSession}
            >
              End Session
            </Button>
          </div>
        )}
        
        <ChatInterface />
      </div>
      <footer className="text-center py-3 text-xs text-gray-500 border-t border-gray-200">
        understand yourself<br />
        Napkin LLC — Zurich
      </footer>
      
      <VoiceChat 
        open={voiceChatOpen} 
        onOpenChange={setVoiceChatOpen} 
      />
      
      {/* Start Session Modal */}
      <Dialog open={showStartModal && !sessionStarted} onOpenChange={setShowStartModal}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Start Your Session</DialogTitle>
            <DialogDescription>
              You're about to begin a 25-minute therapeutic chat session. 
              During this time, you can discuss anything that's on your mind.
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col space-y-4 mt-4">
            <p>Sessions are limited to 25 minutes to create a focused, effective therapeutic framework.</p>
            <p>You can end your session early if needed, but the timer cannot be paused.</p>
          </div>
          <DialogFooter className="mt-6">
            <Button onClick={startSession} className="w-full">
              Start 25-Minute Session
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* End Session Confirmation */}
      <AlertDialog open={showEndConfirmation} onOpenChange={setShowEndConfirmation}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>End Session Early?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to end your session now? Any ongoing conversation will be saved.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Continue Session</AlertDialogCancel>
            <AlertDialogAction onClick={confirmEndSession}>End Session</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default Chat;
