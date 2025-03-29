
import React, { useState, useEffect } from "react";
import { AlertTriangle } from "lucide-react";

interface TimerProps {
  initialMinutes?: number;
  initialSeconds?: number;
  isRunning?: boolean;
  onComplete?: () => void;
}

const Timer: React.FC<TimerProps> = ({ 
  initialMinutes = 25,
  initialSeconds = 0,
  isRunning = false,
  onComplete
}) => {
  const [minutes, setMinutes] = useState(initialMinutes);
  const [seconds, setSeconds] = useState(initialSeconds);
  const [isActive, setIsActive] = useState(isRunning);
  const [isAlmostDone, setIsAlmostDone] = useState(false);

  useEffect(() => {
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
      }, 1000); // Update every second

      return () => clearInterval(timer);
    }
  }, [isActive, onComplete]);

  // Check if less than 5 minutes remain
  useEffect(() => {
    if (minutes < 5) {
      setIsAlmostDone(true);
    }
  }, [minutes]);

  // Reset timer when initialMinutes changes or isRunning is set to true
  useEffect(() => {
    setMinutes(initialMinutes);
    setSeconds(initialSeconds);
    setIsActive(isRunning);
  }, [initialMinutes, initialSeconds, isRunning]);

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
