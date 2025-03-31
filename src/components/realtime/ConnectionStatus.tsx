
import React from 'react';
import { Loader2, CheckCircle, XCircle } from 'lucide-react';

interface ConnectionStatusProps {
  status: 'disconnected' | 'connecting' | 'connected' | 'failed';
  error?: Error | null;
}

const ConnectionStatus: React.FC<ConnectionStatusProps> = ({ status, error }) => {
  return (
    <div className="flex items-center gap-2 mb-4">
      <span className="font-medium">Status:</span>
      {status === 'disconnected' && <span className="text-gray-500">Not connected</span>}
      {status === 'connecting' && <span className="text-blue-500 flex items-center"><Loader2 className="h-4 w-4 mr-1 animate-spin" /> Connecting...</span>}
      {status === 'connected' && <span className="text-green-500 flex items-center"><CheckCircle className="h-4 w-4 mr-1" /> Connected</span>}
      {status === 'failed' && <span className="text-red-500 flex items-center"><XCircle className="h-4 w-4 mr-1" /> Failed</span>}
    </div>
  );
};

export default ConnectionStatus;
