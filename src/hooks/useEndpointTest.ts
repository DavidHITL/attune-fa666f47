
import { useState } from 'react';
import { testRealtimeFunctionEndpoint, testWebSocketConnection } from '@/utils/realtime/testEndpoint';
import { toast } from 'sonner';

export function useEndpointTest() {
  const [isTestingHttp, setIsTestingHttp] = useState(false);
  const [isTestingWs, setIsTestingWs] = useState(false);
  const [httpResult, setHttpResult] = useState<string | null>(null);
  const [wsResult, setWsResult] = useState<string | null>(null);
  const [activeWsConnection, setActiveWsConnection] = useState<{close: () => void} | null>(null);

  const testHttpEndpoint = async () => {
    setIsTestingHttp(true);
    setHttpResult(null);
    
    try {
      const result = await testRealtimeFunctionEndpoint();
      
      if (result.success) {
        toast.success("HTTP endpoint is accessible");
      } else {
        toast.error("HTTP endpoint test failed");
      }
      
      setHttpResult(result.message);
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : String(error);
      toast.error(`Error testing endpoint: ${errorMsg}`);
      setHttpResult(`Test failed: ${errorMsg}`);
    } finally {
      setIsTestingHttp(false);
    }
  };

  const testWsEndpoint = () => {
    setIsTestingWs(true);
    setWsResult(null);
    
    try {
      // Close any existing connection
      if (activeWsConnection) {
        activeWsConnection.close();
      }
      
      const result = testWebSocketConnection();
      
      if (result.success) {
        toast("WebSocket connection attempt started", {
          description: "Check console for connection status"
        });
        setActiveWsConnection(result);
      } else {
        toast.error("WebSocket connection test failed");
      }
      
      setWsResult(result.message);
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : String(error);
      toast.error(`Error testing WebSocket: ${errorMsg}`);
      setWsResult(`Test failed: ${errorMsg}`);
    } finally {
      setIsTestingWs(false);
    }
  };

  const disconnectWs = () => {
    if (activeWsConnection) {
      activeWsConnection.close();
      setActiveWsConnection(null);
      toast("WebSocket disconnected");
      setWsResult("WebSocket connection closed");
    }
  };

  return {
    testHttpEndpoint,
    testWsEndpoint,
    disconnectWs,
    isTestingHttp,
    isTestingWs,
    httpResult,
    wsResult,
    hasActiveWsConnection: !!activeWsConnection
  };
}
