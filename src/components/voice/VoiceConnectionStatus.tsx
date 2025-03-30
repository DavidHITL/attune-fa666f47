import React from 'react';
import { Wifi, WifiOff } from "lucide-react";
type ConnectionStatus = 'connecting' | 'connected' | 'disconnected';
interface VoiceConnectionStatusProps {
  status: ConnectionStatus;
}
const VoiceConnectionStatus: React.FC<VoiceConnectionStatusProps> = ({
  status
}) => {
  return <div className="text-xs flex items-center gap-1">
      {status === 'connected' && <>
          <Wifi size={14} className="text-green-500" />
          <span className="text-green-500">Connected</span>
        </>}
      {status === 'connecting'}
      {status === 'disconnected' && <>
          <WifiOff size={14} className="text-red-500" />
          <span className="text-red-500">Disconnected</span>
        </>}
    </div>;
};
export default VoiceConnectionStatus;