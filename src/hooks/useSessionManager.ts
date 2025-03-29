
import { useState, useEffect } from "react";
import { toast } from "@/hooks/use-toast";

const SESSION_DURATION_MS = 25 * 60 * 1000; // 25 minutes in milliseconds

export const useSessionManager = () => {
  const [sessionStarted, setSessionStarted] = useState(false);
  const [sessionEndTime, setSessionEndTime] = useState<number | null>(null);
  const [showStartModal, setShowStartModal] = useState(true);
  const [showEndConfirmation, setShowEndConfirmation] = useState(false);

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

  return {
    sessionStarted,
    sessionEndTime,
    showStartModal,
    setShowStartModal,
    showEndConfirmation,
    setShowEndConfirmation,
    startSession,
    handleRequestEndSession,
    confirmEndSession
  };
};
