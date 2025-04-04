
import React from 'react';
import { useVoiceChatContext } from '@/hooks/useVoiceChatContext';

/**
 * Component for displaying connection status alerts in the voice chat
 */
const ConnectionStatusAlerts: React.FC = () => {
  const {
    contextLoaded,
    contextLoadError,
    user
  } = useVoiceChatContext();

  return (
    <>
      {/* Loading indicator while context is loading */}
      {!contextLoaded && user?.id && (
        <div className="flex justify-center items-center py-2">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500"></div>
          <span className="ml-2 text-sm text-gray-600">Loading conversation context...</span>
        </div>
      )}
      
      {/* Context loading error message */}
      {contextLoadError && contextLoaded && (
        <div className="bg-yellow-50 border border-yellow-200 text-yellow-800 px-4 py-2 rounded-md text-sm">
          <p>Continuing with limited context: {contextLoadError}</p>
        </div>
      )}
      
      {/* Guest mode warning */}
      {contextLoaded && !user?.id && (
        <div className="bg-blue-50 border border-blue-200 text-blue-800 px-4 py-2 rounded-md text-sm">
          <p>Guest mode: Log in for a personalized experience.</p>
        </div>
      )}
    </>
  );
};

export default ConnectionStatusAlerts;
