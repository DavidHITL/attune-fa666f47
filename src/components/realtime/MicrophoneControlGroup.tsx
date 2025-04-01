
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
      
      {/* Only show control buttons when connected */}
      {isConnected && (
        <div className="flex justify-center gap-4 mt-2">
          <MicrophoneButton 
            isActive={isMicrophoneActive}
            isDisabled={!isConnected || isConnecting || isAiSpeaking}
            onClick={onToggleMicrophone}
          />
          
          <ConnectionControls 
            isConnected={isConnected}
            isConnecting={isConnecting}
            onClose={onClose}
          />
        </div>
      )}
    </div>
  );
};

export default MicrophoneControlGroup;
