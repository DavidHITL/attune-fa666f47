
import React from "react";
import { Button } from "@/components/ui/button";
import { Phone, PhoneCall } from "lucide-react";

interface ConnectionControlsProps {
  isConnected: boolean;
  isConnecting: boolean;
  isMicrophoneActive?: boolean;
  microphonePermission?: PermissionState | null;
  onConnect?: () => Promise<boolean>;
  onDisconnect?: () => void;
  onToggleMicrophone?: () => Promise<boolean>;
  onClose?: () => void;
}

/**
 * Controls for managing the voice chat connection
 */
const ConnectionControls: React.FC<ConnectionControlsProps> = ({
  isConnected,
  isConnecting,
  onConnect,
  onDisconnect,
  onClose
}) => {
  if (isConnected) {
    return (
      <Button 
        variant="outline" 
        size="sm"
        className="flex items-center gap-1"
        onClick={onClose || onDisconnect}
        disabled={isConnecting}
      >
        <Phone className="h-4 w-4" />
        End Call
      </Button>
    );
  }
  
  return (
    <Button
      variant="default"
      size="sm"
      className="flex items-center gap-1"
      onClick={onConnect}
      disabled={isConnecting}
    >
      <PhoneCall className="h-4 w-4" />
      {isConnecting ? 'Connecting...' : 'Start Call'}
    </Button>
  );
};

export default ConnectionControls;
