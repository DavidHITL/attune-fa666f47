
import React from 'react';
import { Badge } from "@/components/ui/badge";
import { WifiOff } from 'lucide-react';

interface ConnectionStatusProps {
  status: 'connecting' | 'connected' | 'disconnected' | 'failed';
  error?: Error | null;
}

const ConnectionStatus: React.FC<ConnectionStatusProps> = () => {
  return (
    <div className="flex items-center gap-1.5">
      <Badge variant="outline" className="bg-slate-50 text-slate-700 border-slate-200 flex items-center gap-1.5 py-1">
        <WifiOff className="h-3.5 w-3.5" />
        <span>Voice Chat Disabled</span>
      </Badge>
    </div>
  );
};

export default ConnectionStatus;
