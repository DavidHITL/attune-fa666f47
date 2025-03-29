
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

const Chat: React.FC = () => {
  const [voiceChatOpen, setVoiceChatOpen] = useState(false);
  const [sessionStarted, setSessionStarted] = useState(false);
  const [showStartModal, setShowStartModal] = useState(true);
  const [showEndConfirmation, setShowEndConfirmation] = useState(false);
  const navigate = useNavigate();

  const handlePhoneClick = () => {
    setVoiceChatOpen(true);
  };

  const startSession = () => {
    setSessionStarted(true);
    setShowStartModal(false);
    toast({
      title: "Session started",
      description: "Your 25-minute therapeutic session has begun."
    });
  };

  const handleSessionComplete = () => {
    setSessionStarted(false);
    toast({
      title: "Session ended",
      description: "Your therapeutic session has ended. Thank you for participating.",
      variant: "default"
    });
    
    // Optional: Navigate away or show a summary
    // navigate("/home");
  };

  const handleRequestEndSession = () => {
    setShowEndConfirmation(true);
  };

  const confirmEndSession = () => {
    setSessionStarted(false);
    setShowEndConfirmation(false);
    toast({
      title: "Session ended early",
      description: "Your session has been ended. Feel free to start a new one when you're ready."
    });
  };

  // If user navigates away and comes back during active session
  useEffect(() => {
    const activeSession = localStorage.getItem('activeSession');
    const sessionEndTime = localStorage.getItem('sessionEndTime');
    
    if (activeSession === 'true' && sessionEndTime) {
      const endTime = parseInt(sessionEndTime, 10);
      const currentTime = new Date().getTime();
      
      if (endTime > currentTime) {
        // Calculate remaining time
        const remainingMs = endTime - currentTime;
        const remainingMinutes = Math.floor(remainingMs / (60 * 1000));
        const remainingSeconds = Math.floor((remainingMs % (60 * 1000)) / 1000);
        
        setSessionStarted(true);
        setShowStartModal(false);
      } else {
        // Session would have ended
        localStorage.removeItem('activeSession');
        localStorage.removeItem('sessionEndTime');
      }
    }
  }, []);

  // Save session state when it starts
  useEffect(() => {
    if (sessionStarted) {
      const endTime = new Date().getTime() + (25 * 60 * 1000); // 25 minutes from now
      localStorage.setItem('activeSession', 'true');
      localStorage.setItem('sessionEndTime', endTime.toString());
    } else {
      localStorage.removeItem('activeSession');
      localStorage.removeItem('sessionEndTime');
    }
  }, [sessionStarted]);

  return (
    <div className="flex flex-col h-screen">
      <NavBar />
      
      {/* Timer component, shows default time if session not started */}
      <Timer 
        initialMinutes={25} 
        initialSeconds={0} 
        isRunning={sessionStarted}
        onComplete={handleSessionComplete}
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
      <Dialog open={showStartModal} onOpenChange={setShowStartModal}>
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
