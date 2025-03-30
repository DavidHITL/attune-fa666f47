
import React from 'react';
import { Button } from "@/components/ui/button";
import { Mic } from "lucide-react";

interface RecordButtonProps {
  isRecording: boolean;
  onStartRecording: () => void;
  onStopRecording: () => void;
}

const RecordButton: React.FC<RecordButtonProps> = ({ 
  isRecording, 
  onStartRecording, 
  onStopRecording 
}) => {
  const handleClick = () => {
    isRecording ? onStopRecording() : onStartRecording();
  };

  return (
    <Button
      variant="outline"
      size="sm"
      className={`rounded-full ${isRecording ? 'bg-red-100' : ''}`}
      onClick={handleClick}
      title={isRecording ? "Stop recording" : "Start recording"}
      type="button"
    >
      <Mic className={`${isRecording ? 'text-red-500' : 'text-blue-500'}`} size={18} />
    </Button>
  );
};

export default RecordButton;
