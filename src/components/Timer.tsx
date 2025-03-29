
import React, { useState, useEffect } from "react";
import { AlertTriangle } from "lucide-react";

interface TimerProps {
  initialMinutes?: number;
  initialSeconds?: number;
  isRunning?: boolean;
  onComplete?: () => void;
  sessionEndTime?: number;
}

const Timer: React.FC<TimerProps> = ({ 
  initialMinutes = 25,
  initialSeconds = 0,
  isRunning = false,
  onComplete,
  sessionEndTime
}) => {
  const [minutes, setMinutes] = useState(initialMinutes);
  const [seconds, setSeconds] = useState(initialSeconds);
  const [isActive, setIsActive] = useState(isRunning);
  const [isAlmostDone, setIsAlmostDone] = useState(false);

  // Calculate remaining time from sessionEndTime
  useEffect(() => {
    if (sessionEndTime) {
      const calculateRemainingTime = () => {
        const now = Date.now();
        const totalRemainingSeconds = Math.max(0, Math.floor((sessionEndTime - now) / 1000));
        
        if (totalRemainingSeconds <= 0) {
          setMinutes(0);
          setSeconds(0);
          setIsActive(false);
          onComplete?.();
          return;
        }
        
        const remainingMinutes = Math.floor(totalRemainingSeconds / 60);
        const remainingSeconds = totalRemainingSeconds % 60;
        
        setMinutes(remainingMinutes);
        setSeconds(remainingSeconds);
        setIsAlmostDone(remainingMinutes < 5);
      };
      
      calculateRemainingTime();
      
      if (isActive) {
        const timer = setInterval(calculateRemainingTime, 1000);
        return () => clearInterval(timer);
      }
    } else {
      // Fall back to countdown logic when no sessionEndTime is provided
      if (isActive) {
        const timer = setInterval(() => {
          setSeconds((prevSeconds) => {
            if (prevSeconds === 0) {
              setMinutes((prevMinutes) => {
                if (prevMinutes <= 0) {
                  clearInterval(timer);
                  setIsActive(false);
                  onComplete?.();
                  return 0;
                }
                return prevMinutes - 1;
              });
              return 59;
            }
            return prevSeconds - 1;
          });
        }, 1000);
  
        return () => clearInterval(timer);
      }
    }
  }, [isActive, onComplete, sessionEndTime]);

  // Check if less than 5 minutes remain
  useEffect(() => {
    if (minutes < 5) {
      setIsAlmostDone(true);
    }
  }, [minutes]);

  // Set initial state based on props
  useEffect(() => {
    if (!sessionEndTime) {
      setMinutes(initialMinutes);
      setSeconds(initialSeconds);
    }
    setIsActive(isRunning);
  }, [initialMinutes, initialSeconds, isRunning, sessionEndTime]);

  const formattedTime = `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;

  return (
    <div className={`text-center py-4 ${isAlmostDone ? 'text-red-600' : 'text-gray-600'} flex justify-center items-center gap-2`}>
      {isAlmostDone && <AlertTriangle size={16} className="text-red-600" />}
      {isActive ? (
        <>{formattedTime} remaining in session</>
      ) : (
        <>{minutes} {minutes === 1 ? "minute" : "minutes"} left</>
      )}
    </div>
  );
};

export default Timer;
