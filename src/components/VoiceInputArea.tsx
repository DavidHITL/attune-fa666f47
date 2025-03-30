
import React from 'react';
import { Input } from "@/components/ui/input";
import RecordButton from './voice/RecordButton';
import SendButton from './voice/SendButton';

interface VoiceInputAreaProps {
  transcript: string;
  setTranscript: (transcript: string) => void;
  onSend: () => void;
  isRecording?: boolean;
  startRecording?: () => void;
  stopRecording?: () => void;
}

const VoiceInputArea: React.FC<VoiceInputAreaProps> = ({ 
  transcript, 
  setTranscript,
  onSend,
  isRecording,
  startRecording,
  stopRecording
}) => {
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleSend = () => {
    if (!transcript.trim()) return;
    console.log("[VoiceInputArea] Sending message");
    onSend();
  };

  return (
    <div className="flex gap-3 p-2 bg-gray-100">
      <Input
        value={transcript}
        onChange={(e) => setTranscript(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder="Type a message..."
        className="flex-1"
      />
      
      <div className="flex gap-2">
        {startRecording && stopRecording && (
          <RecordButton 
            isRecording={isRecording || false} 
            onStartRecording={startRecording} 
            onStopRecording={stopRecording} 
          />
        )}
        
        <SendButton disabled={!transcript.trim()} onClick={handleSend} />
      </div>
    </div>
  );
};

export default VoiceInputArea;
