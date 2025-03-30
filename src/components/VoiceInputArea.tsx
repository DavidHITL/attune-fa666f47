
import React from 'react';
import { Button } from "@/components/ui/button";
import { Mic } from "lucide-react";

interface VoiceInputAreaProps {
  transcript: string;
  setTranscript: (transcript: string) => void;
  onSend: () => void; 
  onSendMessage?: () => Promise<void>;
  isRecording?: boolean;
  startRecording?: () => void;
  stopRecording?: () => void;
}

const VoiceInputArea: React.FC<VoiceInputAreaProps> = ({ 
  transcript, 
  setTranscript,
  onSend,
  onSendMessage,
  isRecording,
  startRecording,
  stopRecording
}) => {
  const handleSend = async () => {
    if (onSendMessage) {
      await onSendMessage();
    } else {
      onSend();
    }
  };

  return (
    <div className="flex gap-3 p-2 bg-apple-gray-6">
      <div className="flex-1 relative">
        <input
          type="text"
          value={transcript}
          onChange={(e) => setTranscript(e.target.value)}
          placeholder="Type a message..."
          className="w-full rounded-md border border-gray-300 py-2 px-3 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
        />
      </div>
      
      {startRecording && stopRecording && (
        <Button
          variant="outline"
          size="sm"
          className={`rounded-full ${isRecording ? 'bg-red-100' : ''}`}
          onClick={isRecording ? stopRecording : startRecording}
          title={isRecording ? "Stop recording" : "Start recording"}
        >
          <Mic className={`${isRecording ? 'text-red-500' : 'text-blue-500'}`} size={18} />
        </Button>
      )}
      
      <Button
        disabled={!transcript.trim()}
        onClick={handleSend}
        size="sm"
      >
        Send
      </Button>
    </div>
  );
};

export default VoiceInputArea;
