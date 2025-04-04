
import { useState, useEffect } from "react";
import { WebRTCConnector } from "@/utils/realtime/WebRTCConnector";

/**
 * Hook to track data channel status
 */
export function useDataChannelStatus(
  isConnected: boolean,
  connectorRef: React.MutableRefObject<WebRTCConnector | null>
) {
  const [isDataChannelReady, setIsDataChannelReady] = useState(false);
  
  // Poll data channel status when connected
  useEffect(() => {
    if (!isConnected || !connectorRef.current) {
      setIsDataChannelReady(false);
      return;
    }
    
    // Set initial state
    setIsDataChannelReady(connectorRef.current.isDataChannelReady());
    
    // Poll for data channel status changes
    const intervalId = setInterval(() => {
      if (connectorRef.current) {
        const isReady = connectorRef.current.isDataChannelReady();
        setIsDataChannelReady(isReady);
      }
    }, 1000);
    
    return () => clearInterval(intervalId);
  }, [isConnected, connectorRef]);
  
  return { isDataChannelReady };
}
