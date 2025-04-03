
import { useCallback } from "react";
import { WebRTCConnector } from "@/utils/realtime/WebRTCConnector";
import { UseWebRTCConnectionOptions } from "../../types";
import { useConnectionErrorHandler } from "../../useConnectionErrorHandler";
import { useConnectionStateHandler } from "../../useConnectionStateHandler";

export function useConnectionSetup(
  isConnected: boolean,
  connectorRef: React.MutableRefObject<WebRTCConnector | null>,
  options: UseWebRTCConnectionOptions,
  setIsConnected: (isConnected: boolean) => void,
  setIsConnecting: (isConnecting: boolean) => void,
  disconnect: () => void,
  toggleMicrophone: () => Promise<boolean>,
  handleMessage: (event: MessageEvent) => void,
  getActiveAudioTrack: () => MediaStreamTrack | null
) {
  // Use the connection error handler hook
  const { handleConnectionError } = useConnectionErrorHandler(
    disconnect,
    setIsConnecting
  );

  // Use the connection state handler hook
  const { handleConnectionStateChange } = useConnectionStateHandler(
    isConnected,
    connectorRef,
    options,
    setIsConnected,
    setIsConnecting,
    disconnect,
    toggleMicrophone
  );

  // Helper function to create and configure WebRTC connector
  const createAndConfigureConnector = useCallback(async () => {
    try {
      // Create the connector with all necessary handlers
      const connector = new WebRTCConnector({
        ...options,
        userId: options.userId, // Pass through the userId
        onMessage: handleMessage,
        onTrack: (event) => {
          console.log("[useConnectionSetup] Track event received, handling via connector");
          // This will be handled by the main hook that integrates the track handler
          if (options.onTrack) {
            options.onTrack(event);
          }
        },
        onConnectionStateChange: handleConnectionStateChange,
        onError: handleConnectionError
      });
      
      return connector;
    } catch (error) {
      console.error("[useConnectionSetup] Error creating connector:", error);
      handleConnectionError(error);
      return null;
    }
  }, [
    options,
    handleMessage,
    handleConnectionStateChange,
    handleConnectionError
  ]);

  return {
    handleConnectionStateChange,
    handleConnectionError,
    createAndConfigureConnector
  };
}
