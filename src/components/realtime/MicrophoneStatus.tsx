
import React from "react";

interface MicrophoneStatusProps {
  isActive: boolean;
}

const MicrophoneStatus: React.FC<MicrophoneStatusProps> = ({ isActive }) => {
  if (!isActive) return null;
  
  return (
    <div className="bg-red-50 border border-red-200 rounded-md p-2 flex items-center justify-center">
      <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse mr-2"></div>
      <span className="text-sm text-red-700">Microphone active - speak now</span>
    </div>
  );
};

export default MicrophoneStatus;
