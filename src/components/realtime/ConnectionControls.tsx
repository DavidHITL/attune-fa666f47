
import React from "react";
import { Button } from "@/components/ui/button";
import { Mic, MicOff, Phone } from "lucide-react";

interface ConnectionControlsProps {
  isConnected: boolean;
  isConnecting: boolean;
  isMicrophoneActive?: boolean;
  microphonePermission?: PermissionState | null;
  isAiSpeaking?: boolean;
  onToggleMicrophone?: () => Promise<boolean>;
  onDisconnect?: () => void;
  onClose?: () => void;
}

/**
 * Controls for managing the voice chat connection and microphone
 */
const ConnectionControls: React.FC<ConnectionControlsProps> = ({
  isConnected,
  isConnecting,
  isMicrophoneActive = false,
  isAiSpeaking = false,
  onToggleMicrophone,
  onDisconnect,
  onClose
}) => {
  // Function to handle call end
  const handleEndCall = () => {
    if (onClose) {
      onClose();
    } else if (onDisconnect) {
      onDisconnect();
    }
  };

  // Function to handle microphone toggle
  const handleMicrophoneToggle = async () => {
    if (onToggleMicrophone) {
      await onToggleMicrophone();
    }
  };

  return (
    <div className="flex items-center justify-center gap-4">
      {/* Only show mic button if connected */}
      {isConnected && (
        <Button 
          variant={isMicrophoneActive ? "default" : "outline"}
          size="sm"
          className="flex items-center gap-1"
          onClick={handleMicrophoneToggle}
          disabled={isConnecting || isAiSpeaking}
          title={isMicrophoneActive ? "Mute microphone" : "Unmute microphone"}
        >
          {isMicrophoneActive ? <Mic className="h-4 w-4" /> : <MicOff className="h-4 w-4" />}
          {isMicrophoneActive ? "Mute" : "Speak"}
        </Button>
      )}
      
      {/* End call button is always shown when connected */}
      {isConnected && (
        <Button 
          variant="outline" 
          size="sm"
          className="flex items-center gap-1"
          onClick={handleEndCall}
          disabled={isConnecting}
        >
          <Phone className="h-4 w-4" />
          End Call
        </Button>
      )}
      
      {/* Show connecting state if not connected */}
      {!isConnected && (
        <Button
          variant="outline"
          size="sm"
          className="flex items-center gap-1"
          disabled={true}
        >
          {isConnecting ? 'Connecting...' : 'Ready'}
        </Button>
      )}
    </div>
  );
};

export default ConnectionControls;
