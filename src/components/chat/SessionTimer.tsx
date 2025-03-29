
import React from "react";
import Timer from "@/components/Timer";

interface SessionTimerProps {
  sessionStarted: boolean;
  sessionEndTime: number | null;
  onSessionComplete: () => void;
}

const SessionTimer: React.FC<SessionTimerProps> = ({
  sessionStarted,
  sessionEndTime,
  onSessionComplete,
}) => {
  return (
    <Timer 
      initialMinutes={25} 
      initialSeconds={0} 
      isRunning={sessionStarted}
      onComplete={onSessionComplete}
      sessionEndTime={sessionEndTime || undefined}
    />
  );
};

export default SessionTimer;
