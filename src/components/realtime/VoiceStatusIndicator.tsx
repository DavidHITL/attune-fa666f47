
import React from "react";

interface VoiceStatusIndicatorProps {
  isAiSpeaking: boolean;
  isMicrophoneActive: boolean;
  isConnecting: boolean;
  isConnected: boolean;
}

/**
 * Visual indicator showing the current state of the voice conversation
 */
const VoiceStatusIndicator: React.FC<VoiceStatusIndicatorProps> = ({
  isAiSpeaking,
  isMicrophoneActive,
  isConnecting,
  isConnected,
}) => {
  return (
    <div className="relative flex flex-col items-center justify-center p-6 rounded-lg bg-gray-50 border border-gray-200">
      <div className={`w-20 h-20 rounded-full flex items-center justify-center 
        ${isAiSpeaking ? 'bg-gray-200' : isMicrophoneActive ? 'bg-blue-100' : 'bg-gray-100'}`}>
        <div className={`w-16 h-16 rounded-full flex items-center justify-center 
          ${isAiSpeaking ? 'bg-gray-300 animate-pulse' : isMicrophoneActive ? 'bg-blue-200 animate-pulse' : 'bg-gray-200'}`}>
          <div className={`w-10 h-10 rounded-full 
            ${isAiSpeaking ? 'bg-gray-400' : isMicrophoneActive ? 'bg-blue-400' : 'bg-gray-400'}`}>
          </div>
        </div>
      </div>
      
      <p className="mt-4 text-center text-sm">
        {isConnecting ? 'Connecting...' : 
         isAiSpeaking ? 'AI is speaking...' : 
         isMicrophoneActive ? 'Listening...' : 
         isConnected ? 'Ready to speak' : 'Voice chat inactive'}
      </p>
    </div>
  );
};

export default VoiceStatusIndicator;
