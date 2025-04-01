
import React from 'react';
import { Button } from "@/components/ui/button";
import { Mic, MicOff, Power, PowerOff } from "lucide-react";
import MicrophoneButton from './MicrophoneButton';
import ConnectionStatus from './ConnectionStatus';

interface ConnectionControlsProps {
  isConnected: boolean;
  isConnecting: boolean;
  isMicrophoneActive: boolean;
  microphonePermission?: PermissionState | null;
  onConnect: () => Promise<boolean>;
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
  onToggleMicrophone
}) => {
  return (
    <div className="flex flex-col gap-2">
      <div className="flex justify-between items-center">
        <ConnectionStatus isConnected={isConnected} isConnecting={isConnecting} />
        
        <div className="flex gap-2">
          {!isConnected ? (
            <Button 
              onClick={onConnect} 
              disabled={isConnecting}
              className={`${isConnecting ? 'opacity-50' : ''}`}
              title="Connect to OpenAI"
            >
              <Power className="h-4 w-4 mr-2" />
              {isConnecting ? 'Connecting...' : 'Connect'}
            </Button>
          ) : (
            <Button 
              onClick={onDisconnect}
              variant="outline"
              title="Disconnect from OpenAI"
            >
              <PowerOff className="h-4 w-4 mr-2" />
              Disconnect
            </Button>
          )}
          
          {isConnected && (
            <MicrophoneButton 
              isActive={isMicrophoneActive} 
              isDisabled={!isConnected || microphonePermission === 'denied'}
              onClick={onToggleMicrophone}
              className="ml-2"
            />
          )}
        </div>
      </div>
      
      {microphonePermission === 'denied' && (
        <div className="text-xs text-red-500 mt-1">
          Microphone access is blocked. Please update your browser settings.
        </div>
      )}
      
      {isConnected && (
        <div className="text-xs text-gray-500">
          {isMicrophoneActive ? (
            <span>Microphone active - OpenAI is listening</span>
          ) : (
            <span>Click the microphone button to speak</span>
          )}
        </div>
      )}
      
      {!isConnected && !isConnecting && (
        <div className="text-xs text-gray-500">
          Connect to start a conversation with OpenAI
        </div>
      )}
    </div>
  );
};

export default ConnectionControls;
