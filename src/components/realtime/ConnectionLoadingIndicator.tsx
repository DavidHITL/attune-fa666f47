
import React from 'react';

interface ConnectionLoadingIndicatorProps {
  isConnecting: boolean;
}

/**
 * Loading indicator shown while establishing connection
 */
const ConnectionLoadingIndicator: React.FC<ConnectionLoadingIndicatorProps> = ({
  isConnecting
}) => {
  if (!isConnecting) return null;
  
  return (
    <div className="flex justify-center">
      <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500"></div>
    </div>
  );
};

export default ConnectionLoadingIndicator;
