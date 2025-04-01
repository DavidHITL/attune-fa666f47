
import { useCallback } from "react";
import { toast } from "sonner";
import { WebRTCConnector } from "@/utils/realtime/WebRTCConnector";

export function useConnectionStateHandler(
  isConnected: boolean,
  connectorRef: React.MutableRefObject<WebRTCConnector | null>,
  options: { enableMicrophone?: boolean },
  setIsConnected: (isConnected: boolean) => void,
  setIsConnecting: (isConnecting: boolean) => void,
  disconnect: () => void,
  toggleMicrophone: () => Promise<boolean>
) {
  // Handle connection state changes
  const handleConnectionStateChange = useCallback((state: RTCPeerConnectionState) => {
    console.log("[useConnectionStateHandler] Connection state changed:", state);
    
    if (state === "connected") {
      console.log("[useConnectionStateHandler] WebRTC connection established successfully");
      setIsConnected(true);
      setIsConnecting(false);
      toast.success("Connected to OpenAI Realtime API");
      
      // Start microphone if enabled
      if (options.enableMicrophone) {
        console.log("[useConnectionStateHandler] Auto-enabling microphone");
        setTimeout(() => {
          toggleMicrophone().catch(err => {
            console.error("[useConnectionStateHandler] Error enabling microphone:", err);
          });
        }, 1000); // Add a small delay before enabling the microphone
      }
    }
    else if (state === "failed") {
      console.error("[useConnectionStateHandler] WebRTC connection failed");
      toast.error("Connection failed. Please try again.");
      disconnect();
      setIsConnecting(false);
    }
    else if (state === "disconnected") {
      console.warn("[useConnectionStateHandler] WebRTC connection disconnected");
      // Give a brief period for potential auto-recovery
      const recoveryTimer = setTimeout(() => {
        if (connectorRef.current?.getConnectionState() !== "connected") {
          toast.error("Connection lost. Please reconnect.");
          disconnect();
        }
      }, 5000); // 5 second grace period for auto-recovery
      
      return () => clearTimeout(recoveryTimer);
    }
    else if (state === "closed") {
      console.warn("[useConnectionStateHandler] WebRTC connection closed");
      if (isConnected) {
        toast.error("Connection closed. Please reconnect if needed.");
        disconnect();
      }
    }
  }, [isConnected, options.enableMicrophone, setIsConnected, setIsConnecting, disconnect, toggleMicrophone, connectorRef]);

  return {
    handleConnectionStateChange
  };
}
