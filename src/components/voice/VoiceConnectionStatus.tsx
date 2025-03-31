
import React from 'react';
import { Badge } from "@/components/ui/badge";
import { Wifi, WifiOff, CheckCircle2 } from 'lucide-react';

interface VoiceConnectionStatusProps {
  status: 'connecting' | 'connected' | 'disconnected' | 'failed';
}

const VoiceConnectionStatus: React.FC<VoiceConnectionStatusProps> = ({ status }) => {
  return (
    <div className="flex items-center gap-1.5">
      {status === 'connected' && (
        <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200 flex items-center gap-1.5 py-1">
          <CheckCircle2 className="h-3.5 w-3.5" />
          <span>Connected</span>
        </Badge>
      )}
      
      {status === 'connecting' && (
        <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200 flex items-center gap-1.5 py-1">
          <Wifi className="h-3.5 w-3.5 animate-pulse" />
          <span>Connecting...</span>
        </Badge>
      )}
      
      {status === 'disconnected' && (
        <Badge variant="outline" className="bg-slate-50 text-slate-700 border-slate-200 flex items-center gap-1.5 py-1">
          <WifiOff className="h-3.5 w-3.5" />
          <span>Disconnected</span>
        </Badge>
      )}
      
      {status === 'failed' && (
        <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200 flex items-center gap-1.5 py-1">
          <WifiOff className="h-3.5 w-3.5" />
          <span>Connection Failed</span>
        </Badge>
      )}
    </div>
  );
};

export default VoiceConnectionStatus;
