
import { useState } from 'react';
import { testRealtimeFunctionEndpoint, testWebSocketConnection, testCompleteChatFlow } from '@/utils/realtime/testEndpoint';
import { toast } from 'sonner';

export function useEndpointTest() {
  const [isTestingHttp, setIsTestingHttp] = useState(false);
  const [isTestingWs, setIsTestingWs] = useState(false);
  const [isTestingFlow, setIsTestingFlow] = useState(false);
  const [httpResult, setHttpResult] = useState<string | null>(null);
  const [wsResult, setWsResult] = useState<string | null>(null);
  const [flowResult, setFlowResult] = useState<string | null>(null);
  const [httpStatus, setHttpStatus] = useState<'success' | 'error' | null>(null);
  const [wsStatus, setWsStatus] = useState<'success' | 'error' | null>(null);
  const [flowStatus, setFlowStatus] = useState<'success' | 'error' | null>(null);
  const [activeWsConnection, setActiveWsConnection] = useState<{close: () => void} | null>(null);
  const [activeFlowConnection, setActiveFlowConnection] = useState<{close: () => void} | null>(null);

  const testHttpEndpoint = async () => {
    setIsTestingHttp(true);
    setHttpResult(null);
    setHttpStatus(null);
    
    try {
      const result = await testRealtimeFunctionEndpoint();
      
      if (result.success) {
        setHttpStatus('success');
        toast.success("HTTP endpoint is accessible");
      } else {
        setHttpStatus('error');
        toast.error("HTTP endpoint test failed");
      }
      
      setHttpResult(result.message);
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : String(error);
      setHttpStatus('error');
      toast.error(`Error testing endpoint: ${errorMsg}`);
      setHttpResult(`Test failed: ${errorMsg}`);
    } finally {
      setIsTestingHttp(false);
    }
  };

  const testWsConnection = () => {
    setIsTestingWs(true);
    setWsResult(null);
    setWsStatus(null);
    
    try {
      // Close any existing connection
      if (activeWsConnection) {
        activeWsConnection.close();
      }
      
      const result = testWebSocketConnection();
      
      if (result.success) {
        setWsStatus('success');
        toast("WebSocket connection attempt started", {
          description: "Check console for connection status"
        });
        setActiveWsConnection(result);
      } else {
        setWsStatus('error');
        toast.error("WebSocket connection test failed");
      }
      
      setWsResult(result.message);
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : String(error);
      setWsStatus('error');
      toast.error(`Error testing WebSocket: ${errorMsg}`);
      setWsResult(`Test failed: ${errorMsg}`);
    } finally {
      setIsTestingWs(false);
    }
  };

  const testFullChatFlow = () => {
    setIsTestingFlow(true);
    setFlowResult(null);
    setFlowStatus(null);
    
    try {
      // Close any existing connections
      if (activeFlowConnection) {
        activeFlowConnection.close();
      }
      
      const result = testCompleteChatFlow();
      
      if (result.success) {
        setFlowStatus('success');
        toast("Full chat flow test started", {
          description: "Check console for detailed progress"
        });
        setActiveFlowConnection(result);
      } else {
        setFlowStatus('error');
        toast.error("Chat flow test failed");
      }
      
      setFlowResult(result.message);
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : String(error);
      setFlowStatus('error');
      toast.error(`Error testing chat flow: ${errorMsg}`);
      setFlowResult(`Test failed: ${errorMsg}`);
    } finally {
      setIsTestingFlow(false);
    }
  };

  const closeWsConnection = () => {
    if (activeWsConnection) {
      activeWsConnection.close();
      setActiveWsConnection(null);
      setWsStatus(null);
      toast("WebSocket disconnected");
      setWsResult("WebSocket connection closed");
    }
  };

  const closeFlowConnection = () => {
    if (activeFlowConnection) {
      activeFlowConnection.close();
      setActiveFlowConnection(null);
      setFlowStatus(null);
      toast("Chat flow test disconnected");
      setFlowResult("Chat flow test closed");
    }
  };

  return {
    // Test functions
    testHttpEndpoint,
    testWsConnection,
    testFullChatFlow,
    closeWsConnection,
    closeFlowConnection,
    
    // Status indicators
    httpStatus,
    wsStatus,
    flowStatus,
    
    // Messages
    httpMessage: httpResult,
    wsMessage: wsResult,
    flowMessage: flowResult,
    
    // Loading states
    isLoading: {
      http: isTestingHttp,
      ws: isTestingWs,
      flow: isTestingFlow
    },
    
    // Connection states
    hasActiveWsConnection: !!activeWsConnection,
    hasActiveFlowConnection: !!activeFlowConnection
  };
}
