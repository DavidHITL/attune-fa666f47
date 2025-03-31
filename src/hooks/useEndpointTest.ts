
import { useState } from 'react';
import { toast } from 'sonner';

/**
 * Stub implementation of useEndpointTest hook.
 * Real-time functionality has been removed.
 */
export function useEndpointTest() {
  const [isTestingHttp, setIsTestingHttp] = useState(false);
  const [httpResult, setHttpResult] = useState<string | null>(null);
  const [httpStatus, setHttpStatus] = useState<'success' | 'error' | null>(null);
  
  const testHttpEndpoint = async () => {
    setIsTestingHttp(true);
    setHttpResult(null);
    setHttpStatus(null);
    
    try {
      // This is a stub implementation
      setTimeout(() => {
        setHttpStatus('error');
        setHttpResult('Real-time voice functionality has been removed');
        toast.error('Real-time voice functionality has been removed');
      }, 500);
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : String(error);
      setHttpStatus('error');
      toast.error(`Error: ${errorMsg}`);
      setHttpResult(`Test failed: ${errorMsg}`);
    } finally {
      setIsTestingHttp(false);
    }
  };

  return {
    // Test functions
    testHttpEndpoint,
    testWsConnection: () => toast.info('Real-time voice functionality has been removed'),
    testFullChatFlow: () => toast.info('Real-time voice functionality has been removed'),
    closeWsConnection: () => {},
    closeFlowConnection: () => {},
    
    // Status indicators
    httpStatus,
    wsStatus: null,
    flowStatus: null,
    
    // Messages
    httpMessage: httpResult,
    wsMessage: 'Real-time voice functionality has been removed',
    flowMessage: 'Real-time voice functionality has been removed',
    
    // Loading states
    isLoading: {
      http: isTestingHttp,
      ws: false,
      flow: false
    },
    
    // Connection states
    hasActiveWsConnection: false,
    hasActiveFlowConnection: false
  };
}
