
import { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { supabase } from "@/integrations/supabase/client";

const SESSION_DURATION_MS = 25 * 60 * 1000; // 25 minutes in milliseconds

export const useSessionManager = () => {
  const [sessionStarted, setSessionStarted] = useState(false);
  const [sessionEndTime, setSessionEndTime] = useState<number | null>(null);
  const [showStartModal, setShowStartModal] = useState(true);
  const [showEndConfirmation, setShowEndConfirmation] = useState(false);
  const { user } = useAuth();

  const triggerAnalysis = async (userId: string) => {
    try {
      if (!userId) return;
      
      // Add an entry to the analysis_queue table
      await supabase
        .from('analysis_queue')
        .insert([{ user_id: userId }]);
    } catch (error) {
      console.error("Error queueing analysis on session end:", error);
    }
  };

  const startSession = () => {
    const endTime = Date.now() + SESSION_DURATION_MS;
    setSessionStarted(true);
    setSessionEndTime(endTime);
    setShowStartModal(false);
    
    // Save session state to localStorage
    localStorage.setItem('sessionActive', 'true');
    localStorage.setItem('sessionEndTime', endTime.toString());
    
    console.log("Session started with end time:", new Date(endTime).toLocaleTimeString());
  };

  const handleSessionComplete = () => {
    setSessionStarted(false);
    setSessionEndTime(null);
    
    // Clear session data
    localStorage.removeItem('sessionActive');
    localStorage.removeItem('sessionEndTime');
    
    // Trigger analysis when session ends
    if (user?.id) {
      triggerAnalysis(user.id);
    }
    
    console.log("Session ended");
    
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

    // Trigger analysis when session is manually ended
    if (user?.id) {
      triggerAnalysis(user.id);
    }
    
    console.log("Session ended early by user");
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
