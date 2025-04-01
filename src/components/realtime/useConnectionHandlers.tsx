
import { useState, useCallback, useRef, useEffect } from 'react';
import { toast } from "sonner";
import { useWebRTCConnection } from '@/hooks/useWebRTCConnection';
import { AudioPlaybackManager } from "@/utils/realtime/audio/AudioPlaybackManager";

interface UseConnectionHandlersProps {
  autoConnect?: boolean;
  sessionEndTime?: number | null;
}

/**
 * Hook to manage voice chat connection state and handlers
 * Uses the actual WebRTC connection under the hood
 */
export function useConnectionHandlers({
  autoConnect = true,
  sessionEndTime
}: UseConnectionHandlersProps = {}) {
  const [isConnected, setIsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const audioPlaybackManagerRef = useRef<AudioPlaybackManager | null>(null);
  
  // Initialize audio playback manager
  useEffect(() => {
    if (!audioPlaybackManagerRef.current) {
      audioPlaybackManagerRef.current = new AudioPlaybackManager();
      console.log("[useConnectionHandlers] AudioPlaybackManager initialized");
    }
    
    return () => {
      if (audioPlaybackManagerRef.current) {
        audioPlaybackManagerRef.current.cleanup();
        audioPlaybackManagerRef.current = null;
      }
    };
  }, []);
  
  // Use the actual WebRTC connection hook
  const {
    connect: webRtcConnect,
    disconnect: webRtcDisconnect,
    isConnected: webRtcIsConnected,
    isConnecting: webRtcIsConnecting,
    setAudioPlaybackManager
  } = useWebRTCConnection({
    instructions: "You are a helpful, conversational AI assistant that responds concisely and clearly.",
    voice: "alloy",
    autoConnect: false // We'll handle this ourselves
  });
  
  // Connect audio playback manager to WebRTC connection
  useEffect(() => {
    if (audioPlaybackManagerRef.current && setAudioPlaybackManager) {
      setAudioPlaybackManager(audioPlaybackManagerRef.current);
    }
  }, [setAudioPlaybackManager]);
  
  // Update local state based on WebRTC state
  useEffect(() => {
    setIsConnected(webRtcIsConnected);
    setIsConnecting(webRtcIsConnecting);
  }, [webRtcIsConnected, webRtcIsConnecting]);

  // Function to handle connection to voice chat
  const connectVoiceChat = useCallback(async () => {
    // Don't attempt to connect if already connected or connecting
    if (isConnected || isConnecting) {
      console.log("[useConnectionHandlers] Already connected or connecting, skipping connection attempt");
      return isConnected; // Return current connection state
    }
    
    try {
      console.log("[useConnectionHandlers] Starting voice chat connection process");
      setIsConnecting(true);
      
      // Use the actual WebRTC connect function
      const success = await webRtcConnect();
      
      if (success) {
        setIsConnected(true);
        console.log("[useConnectionHandlers] Voice connection established successfully");
        toast.success("Voice connection established");
      } else {
        console.error("[useConnectionHandlers] Failed to establish voice connection");
        toast.error("Failed to establish voice connection");
      }
      
      return success;
    } catch (error) {
      console.error("[useConnectionHandlers] Connection error:", error);
      toast.error("Failed to establish voice connection");
      return false;
    } finally {
      setIsConnecting(false);
    }
  }, [isConnected, isConnecting, webRtcConnect]);

  // Function to disconnect from voice chat
  const disconnectVoiceChat = useCallback(() => {
    if (isConnected) {
      webRtcDisconnect();
      setIsConnected(false);
      console.log("[useConnectionHandlers] Voice chat disconnected");
      toast.info("Voice chat disconnected");
    }
  }, [isConnected, webRtcDisconnect]);

  return {
    isConnected,
    isConnecting,
    setIsConnected,
    setIsConnecting,
    connectVoiceChat,
    disconnectVoiceChat,
    autoConnect
  };
}
