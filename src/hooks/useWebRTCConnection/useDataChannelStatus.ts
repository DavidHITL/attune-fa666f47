
import { useState, useEffect } from "react";
import { WebRTCConnector } from "@/utils/realtime/WebRTCConnector";

/**
 * Hook to monitor WebRTC data channel readiness
 */
export function useDataChannelStatus(
  isConnected: boolean,
  connectorRef: React.MutableRefObject<WebRTCConnector | null>
) {
  const [isDataChannelReady, setIsDataChannelReady] = useState<boolean>(false);

  // Periodically check if the data channel is ready
  useEffect(() => {
    if (!isConnected || !connectorRef.current) {
      setIsDataChannelReady(false);
      return;
    }
    
    const checkDataChannelReady = () => {
      const isReady = connectorRef.current?.isDataChannelReady() || false;
      if (isReady !== isDataChannelReady) {
        setIsDataChannelReady(isReady);
        if (isReady) {
          console.log("[useDataChannelStatus] Data channel is now ready for sending data");
        }
      }
    };
    
    // Check immediately
    checkDataChannelReady();
    
    // Then check periodically
    const interval = setInterval(checkDataChannelReady, 1000);
    
    return () => clearInterval(interval);
  }, [isConnected, connectorRef, isDataChannelReady]);

  return {
    isDataChannelReady
  };
}
