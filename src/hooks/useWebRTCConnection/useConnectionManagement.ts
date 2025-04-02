
import { useState, useRef, useCallback, useEffect } from "react";
import { WebRTCConnector } from "@/utils/realtime/WebRTCConnector";
import { UseWebRTCConnectionOptions, WebRTCMessage, WebRTCOptions } from "./types";
import { AudioPlaybackManager } from "@/utils/realtime/audio/AudioPlaybackManager";
import { WebRTCMessageHandler } from "@/utils/realtime/WebRTCMessageHandler";
import { toast } from "sonner";

export function useConnectionManagement(
  options: WebRTCOptions,
  onMessage: (message: WebRTCMessage) => void
) {
  const [isConnecting, setIsConnecting] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [isConnectionError, setIsConnectionError] = useState(false);
  const [connectionAttempts, setConnectionAttempts] = useState(0);
  const maxConnectionAttempts = 3;
  
  const connectorRef = useRef<WebRTCConnector | null>(null);
  const messageHandlerRef = useRef<WebRTCMessageHandler | null>(null);
  const connectionTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  
  // Clear any connection timers on unmount
  useEffect(() => {
    return () => {
      if (connectionTimerRef.current) {
        clearTimeout(connectionTimerRef.current);
        connectionTimerRef.current = null;
      }
    };
  }, []);
  
  // Enhanced error handler
  const handleConnectionError = useCallback((error: Error) => {
    console.error("[useConnectionManagement] Connection error:", error);
    setIsConnectionError(true);
    setIsConnecting(false);
    
    // Dispatch a custom error event that can be caught by components
    const errorEvent = new CustomEvent("webrtc-error", { 
      detail: { error } 
    });
    window.dispatchEvent(errorEvent);
    
    // Check if we should attempt reconnection
    if (connectionAttempts < maxConnectionAttempts) {
      const newAttempts = connectionAttempts + 1;
      setConnectionAttempts(newAttempts);
      
      // Wait a bit before attempting to reconnect
      console.log(`[useConnectionManagement] Will attempt reconnection (${newAttempts}/${maxConnectionAttempts}) in 2 seconds...`);
      connectionTimerRef.current = setTimeout(() => {
        connect().catch(console.error);
      }, 2000);
    } else {
      toast.error(`Failed to connect after ${maxConnectionAttempts} attempts. Please try again later.`);
      
      // If we have an error handler in the options, call it
      if (options.onError) {
        options.onError(new Error(`Failed to connect after ${maxConnectionAttempts} attempts`));
      }
    }
  }, [connectionAttempts, maxConnectionAttempts, options.onError]);
  
  // Create enhanced message handler
  const setupMessageHandler = useCallback(() => {
    if (!messageHandlerRef.current) {
      messageHandlerRef.current = new WebRTCMessageHandler({
        onMessageReceived: onMessage,
        userId: options.userId,
        instructions: options.instructions,
      });
      
      console.log("[useConnectionManagement] Created message handler with userId:", options.userId);
    }
  }, [options.userId, options.instructions, onMessage]);
  
  // Connect to OpenAI's WebRTC API
  const connect = useCallback(async (): Promise<boolean> => {
    // Don't try to connect if we're already connecting or connected
    if (isConnecting) {
      console.log("[useConnectionManagement] Already connecting, ignoring connect request");
      return false;
    }
    
    if (isConnected && connectorRef.current) {
      console.log("[useConnectionManagement] Already connected, ignoring connect request");
      return true;
    }
    
    try {
      console.log("[useConnectionManagement] Starting connection process");
      setIsConnecting(true);
      setIsConnectionError(false);
      
      // Create WebRTC connector with options
      connectorRef.current = new WebRTCConnector({
        ...options,
        onMessage: (event: MessageEvent) => {
          try {
            setupMessageHandler();
            messageHandlerRef.current?.handleMessage(event);
          } catch (error) {
            console.error("[useConnectionManagement] Error handling message:", error);
          }
        },
        onError: handleConnectionError
      });
      
      // Attempt to connect
      const connected = await connectorRef.current.connect();
      
      if (connected) {
        console.log("[useConnectionManagement] Connection established successfully");
        setIsConnected(true);
        setIsConnecting(false);
        setConnectionAttempts(0); // Reset attempts counter on successful connection
        return true;
      } else {
        console.error("[useConnectionManagement] Failed to establish connection");
        setIsConnected(false);
        setIsConnecting(false);
        // This will trigger reconnect if we haven't exceeded max attempts
        handleConnectionError(new Error("Failed to establish connection"));
        return false;
      }
    } catch (error) {
      console.error("[useConnectionManagement] Error during connection:", error);
      setIsConnected(false);
      setIsConnecting(false);
      handleConnectionError(error instanceof Error ? error : new Error(String(error)));
      return false;
    }
  }, [isConnecting, isConnected, options, setupMessageHandler, handleConnectionError]);
  
  // Disconnect from OpenAI's WebRTC API
  const disconnect = useCallback(() => {
    if (connectorRef.current) {
      connectorRef.current.disconnect();
      connectorRef.current = null;
    }
    
    // Clear any pending reconnection timers
    if (connectionTimerRef.current) {
      clearTimeout(connectionTimerRef.current);
      connectionTimerRef.current = null;
    }
    
    setIsConnected(false);
    setIsConnecting(false);
    setConnectionAttempts(0);
    console.log("[useConnectionManagement] Disconnected from OpenAI WebRTC API");
  }, []);
  
  // Set the AudioPlaybackManager for the connector
  const setAudioPlaybackManager = useCallback((manager: AudioPlaybackManager) => {
    if (connectorRef.current) {
      connectorRef.current.setAudioPlaybackManager(manager);
      console.log("[useConnectionManagement] AudioPlaybackManager set");
    } else {
      console.warn("[useConnectionManagement] Cannot set AudioPlaybackManager: No active connector");
    }
  }, []);
  
  return {
    connect,
    disconnect,
    setAudioPlaybackManager,
    isConnected,
    isConnecting,
    isConnectionError,
    connectorRef
  };
}
