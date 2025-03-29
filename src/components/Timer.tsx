
import React, { useState, useEffect } from "react";

interface TimerProps {
  initialMinutes?: number;
}

const Timer: React.FC<TimerProps> = ({ initialMinutes = 15 }) => {
  const [minutes, setMinutes] = useState(initialMinutes);

  useEffect(() => {
    const timer = setInterval(() => {
      setMinutes((prevMinutes) => {
        if (prevMinutes <= 1) {
          clearInterval(timer);
          return 0;
        }
        return prevMinutes - 1;
      });
    }, 60000); // Update every minute

    return () => clearInterval(timer);
  }, []);

  return (
    <div className="text-center py-4 text-gray-600">
      {minutes} {minutes === 1 ? "minute" : "minutes"} left
    </div>
  );
};

export default Timer;
