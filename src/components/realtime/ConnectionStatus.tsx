
import React from 'react';
import { Badge } from "@/components/ui/badge";
import { Wifi, WifiOff, AlertCircle } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

interface ConnectionStatusProps {
  status: 'connecting' | 'connected' | 'disconnected';
  error?: Error | null;
}

const ConnectionStatus: React.FC<ConnectionStatusProps> = ({ 
  status,
  error
}) => {
  return (
    <div className="flex items-center gap-1.5">
      {status === 'connected' && (
        <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200 flex items-center gap-1.5 py-1">
          <Wifi className="h-3.5 w-3.5" />
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
        <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200 flex items-center gap-1.5 py-1">
          <WifiOff className="h-3.5 w-3.5" />
          <span>Disconnected</span>
          {error && (
            <Tooltip>
              <TooltipTrigger asChild>
                <AlertCircle className="h-3.5 w-3.5 ml-1 cursor-help" />
              </TooltipTrigger>
              <TooltipContent className="max-w-[300px]">
                <p>{error.message}</p>
              </TooltipContent>
            </Tooltip>
          )}
        </Badge>
      )}
    </div>
  );
};

export default ConnectionStatus;
