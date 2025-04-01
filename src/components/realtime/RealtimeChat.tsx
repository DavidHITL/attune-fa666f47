
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import VoiceChat from '@/components/realtime/VoiceChat';
import MicrophoneButton from '@/components/realtime/MicrophoneButton';
import MicrophoneStatus from '@/components/realtime/MicrophoneStatus';
import TranscriptDisplay from '@/components/realtime/TranscriptDisplay';
import { X } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface RealtimeChatProps {
  sessionStarted?: boolean;
  sessionEndTime?: number | null;
  onClose?: () => void;
}

const RealtimeChat: React.FC<RealtimeChatProps> = ({
  sessionStarted = false,
  sessionEndTime = null,
  onClose
}) => {
  const [isConnected, setIsConnected] = useState(false);
  const [isMicrophoneActive, setIsMicrophoneActive] = useState(false);
  const [isAiSpeaking, setIsAiSpeaking] = useState(false);
  const [currentTranscript, setCurrentTranscript] = useState("");
  
  // Mock function for microphone toggle - will be replaced by actual implementation
  const handleMicrophoneToggle = async () => {
    setIsMicrophoneActive(!isMicrophoneActive);
    return true;
  };
  
  return (
    <div className="fixed bottom-20 right-4 z-50 w-96 md:w-[460px]">
      <Card className="shadow-lg border-gray-200 bg-white">
        <CardHeader className="pb-2">
          <CardTitle className="text-lg flex justify-between items-center">
            <span>Voice Chat</span>
            {onClose && (
              <Button 
                variant="ghost" 
                size="sm" 
                className="h-8 w-8 p-0 rounded-full" 
                onClick={onClose}
              >
                <X className="h-4 w-4" />
                <span className="sr-only">Close</span>
              </Button>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col gap-4">
            {/* Voice Indicator */}
            <div className={`relative flex flex-col items-center justify-center p-6 rounded-lg bg-gray-50 ${isAiSpeaking ? 'border-2 border-green-500' : 'border border-gray-200'}`}>
              <div className={`w-20 h-20 rounded-full flex items-center justify-center 
                ${isAiSpeaking ? 'bg-green-100' : isMicrophoneActive ? 'bg-blue-100' : 'bg-gray-100'}`}>
                <div className={`w-16 h-16 rounded-full flex items-center justify-center 
                  ${isAiSpeaking ? 'bg-green-200 animate-pulse' : isMicrophoneActive ? 'bg-red-200 animate-pulse' : 'bg-gray-200'}`}>
                  <div className={`w-10 h-10 rounded-full 
                    ${isAiSpeaking ? 'bg-green-400' : isMicrophoneActive ? 'bg-red-400' : 'bg-gray-400'}`}>
                  </div>
                </div>
              </div>
              
              <p className="mt-4 text-center text-sm">
                {isAiSpeaking ? 'AI is speaking...' : 
                 isMicrophoneActive ? 'Listening...' : 
                 isConnected ? 'Ready to speak' : 'Voice chat inactive'}
              </p>
            </div>
            
            {/* Microphone Status */}
            <MicrophoneStatus isActive={isMicrophoneActive} />
            
            {/* Transcript Display */}
            <TranscriptDisplay 
              isConnected={isConnected}
              isAiSpeaking={isAiSpeaking}
              isProcessingAudio={false}
              currentTranscript={currentTranscript}
            />
            
            {/* Control Buttons */}
            <div className="flex justify-center gap-4 mt-2">
              <MicrophoneButton 
                isActive={isMicrophoneActive}
                isDisabled={!isConnected}
                onClick={handleMicrophoneToggle}
              />
              
              <Button 
                variant="outline" 
                size="sm"
                className="flex items-center gap-1"
                onClick={onClose}
              >
                End Call
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default RealtimeChat;
