
import React from 'react';
import { Badge } from "@/components/ui/badge";
import { Loader2, Wifi, WifiOff } from 'lucide-react';

interface ConnectionStatusProps {
  isConnected: boolean;
  isConnecting: boolean;
}

const ConnectionStatus: React.FC<ConnectionStatusProps> = ({ isConnected, isConnecting }) => {
  return (
    <div className="flex items-center gap-1.5">
      <Badge 
        variant="outline" 
        className={`${
          isConnected ? 'bg-green-50 text-green-700 border-green-200' : 
          isConnecting ? 'bg-yellow-50 text-yellow-700 border-yellow-200' : 
          'bg-slate-50 text-slate-700 border-slate-200'
        } flex items-center gap-1.5 py-1`}
      >
        {isConnecting ? (
          <>
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
            <span>Connecting...</span>
          </>
        ) : isConnected ? (
          <>
            <Wifi className="h-3.5 w-3.5" />
            <span>Connected</span>
          </>
        ) : (
          <>
            <WifiOff className="h-3.5 w-3.5" />
            <span>Disconnected</span>
          </>
        )}
      </Badge>
    </div>
  );
};

export default ConnectionStatus;
