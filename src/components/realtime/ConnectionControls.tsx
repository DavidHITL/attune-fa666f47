
import React from "react";
import { Button } from "@/components/ui/button";
import { X } from "lucide-react";
import MicrophoneButton from "./MicrophoneButton";

interface ConnectionControlsProps {
  isConnected: boolean;
  isConnecting: boolean;
  isMicrophoneActive: boolean;
  microphonePermission: PermissionState | null;
  onConnect: () => void;
  onDisconnect: () => void;
  onToggleMicrophone: () => Promise<boolean>;
}

const ConnectionControls: React.FC<ConnectionControlsProps> = ({
  isConnected,
  isConnecting,
  isMicrophoneActive,
  microphonePermission,
  onConnect,
  onDisconnect,
  onToggleMicrophone,
}) => {
  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center space-x-2">
        <div 
          className={`w-3 h-3 rounded-full ${
            isConnected ? "bg-green-500" : 
            isConnecting ? "bg-yellow-500 animate-pulse" : "bg-red-500"
          }`}
        />
        <span className="text-sm font-medium">
          {isConnected ? "Connected" : isConnecting ? "Connecting..." : "Disconnected"}
        </span>
      </div>
      
      <div className="flex space-x-2">
        {isConnected ? (
          <>
            <MicrophoneButton 
              isConnected={isConnected}
              isMicrophoneActive={isMicrophoneActive}
              microphonePermission={microphonePermission}
              onToggle={onToggleMicrophone}
            />
            
            <Button
              size="sm"
              variant="outline"
              onClick={onDisconnect}
              className="flex items-center gap-1"
            >
              <X size={16} />
              End Call
            </Button>
          </>
        ) : (
          <Button
            size="sm"
            onClick={onConnect}
            disabled={isConnecting}
            className="flex items-center gap-1"
          >
            {isConnecting ? "Connecting..." : "Start Voice Call"}
          </Button>
        )}
      </div>
    </div>
  );
};

export default ConnectionControls;
