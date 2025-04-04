
import { useCallback, useRef } from "react";
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
  // Track recovery attempts and reconnection status
  const recoveryTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const reconnectionAttemptRef = useRef(0);
  const maxReconnectionAttempts = 3;

  // Handle connection state changes with improved recovery logic
  const handleConnectionStateChange = useCallback((state: RTCPeerConnectionState) => {
    console.log("[useConnectionStateHandler] Connection state changed:", state);
    
    if (state === "connected") {
      console.log("[useConnectionStateHandler] WebRTC connection established successfully");
      setIsConnected(true);
      setIsConnecting(false);
      toast.success("Connected to OpenAI Realtime API");
      
      // Reset recovery counters
      reconnectionAttemptRef.current = 0;
      if (recoveryTimerRef.current) {
        clearTimeout(recoveryTimerRef.current);
        recoveryTimerRef.current = null;
      }
      
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
      
      // Increment reconnection attempt and check if we should try again
      reconnectionAttemptRef.current++;
      
      if (reconnectionAttemptRef.current <= maxReconnectionAttempts) {
        toast.warning(`Connection failed, attempting recovery (${reconnectionAttemptRef.current}/${maxReconnectionAttempts})...`);
        setIsConnecting(true);
        
        // We don't disconnect here to let the reconnection system try to recover
        // The WebRTCConnectionManager's reconnection logic will handle this
      } else {
        console.error(`[useConnectionStateHandler] Maximum reconnection attempts (${maxReconnectionAttempts}) reached, giving up`);
        toast.error("Connection failed after multiple attempts. Please try again.");
        disconnect();
      }
    }
    else if (state === "disconnected") {
      console.warn("[useConnectionStateHandler] WebRTC connection disconnected");
      toast.warning("Connection temporarily lost, attempting to recover...");
      setIsConnecting(true);
      
      // Set a timeout for explicit recovery if the auto-reconnection doesn't work
      if (recoveryTimerRef.current) {
        clearTimeout(recoveryTimerRef.current);
      }
      
      // Increased from 10s to 15s to give more time for recovery
      recoveryTimerRef.current = setTimeout(() => {
        // If we're still in the disconnected state after the grace period
        if (connectorRef.current?.getConnectionState() !== "connected") {
          reconnectionAttemptRef.current++;
          
          if (reconnectionAttemptRef.current <= maxReconnectionAttempts) {
            console.log(`[useConnectionStateHandler] Still disconnected after grace period, attempt ${reconnectionAttemptRef.current}/${maxReconnectionAttempts}`);
            // The WebRTCConnectionManager's internal reconnection should be handling this
          } else {
            console.error(`[useConnectionStateHandler] Maximum reconnection attempts (${maxReconnectionAttempts}) reached, giving up`);
            toast.error("Connection could not be recovered. Please reconnect.");
            disconnect();
          }
        }
      }, 15000); // 15 second grace period for auto-recovery (increased from 10s)
    }
    else if (state === "closed") {
      console.warn("[useConnectionStateHandler] WebRTC connection closed");
      
      // Clean up any pending recovery timers
      if (recoveryTimerRef.current) {
        clearTimeout(recoveryTimerRef.current);
        recoveryTimerRef.current = null;
      }
      
      if (isConnected) {
        toast.info("Connection closed. Please reconnect if needed.");
        disconnect();
      }
    }
  }, [isConnected, options.enableMicrophone, setIsConnected, setIsConnecting, disconnect, toggleMicrophone, connectorRef]);

  // Clean up on unmount
  return {
    handleConnectionStateChange
  };
}
