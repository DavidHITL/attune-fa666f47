
import React from 'react';
import MicrophoneButton from './MicrophoneButton';
import MicrophoneStatus from './MicrophoneStatus';
import ConnectionControls from './ConnectionControls';

interface MicrophoneControlGroupProps {
  isConnected: boolean;
  isConnecting: boolean;
  isMicrophoneActive: boolean;
  isAiSpeaking: boolean;
  onToggleMicrophone: () => Promise<boolean>;
  onClose?: () => void;
}

/**
 * Component that groups all microphone and connection controls
 */
const MicrophoneControlGroup: React.FC<MicrophoneControlGroupProps> = ({
  isConnected,
  isConnecting,
  isMicrophoneActive,
  isAiSpeaking,
  onToggleMicrophone,
  onClose
}) => {
  return (
    <div className="flex flex-col gap-2">
      {/* Microphone Status */}
      <MicrophoneStatus isActive={isMicrophoneActive} />
      
      {/* Connection controls - now uses the updated version with mic control */}
      <ConnectionControls 
        isConnected={isConnected}
        isConnecting={isConnecting}
        isMicrophoneActive={isMicrophoneActive}
        isAiSpeaking={isAiSpeaking}
        onToggleMicrophone={onToggleMicrophone}
        onClose={onClose}
      />
    </div>
  );
};

export default MicrophoneControlGroup;
