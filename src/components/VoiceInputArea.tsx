
import React from 'react';
import { Button } from "@/components/ui/button";

interface VoiceInputAreaProps {
  transcript: string;
  setTranscript: (transcript: string) => void;
  onSend: () => void;
}

const VoiceInputArea: React.FC<VoiceInputAreaProps> = ({ 
  transcript, 
  setTranscript, 
  onSend 
}) => {
  return (
    <div className="flex gap-3">
      <div className="flex-1 relative">
        <input
          type="text"
          value={transcript}
          onChange={(e) => setTranscript(e.target.value)}
          placeholder="Type a message..."
          className="w-full rounded-md border border-gray-300 py-2 px-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>
      <Button
        disabled={!transcript.trim()}
        onClick={onSend}
        size="sm"
      >
        Send
      </Button>
    </div>
  );
};

export default VoiceInputArea;
