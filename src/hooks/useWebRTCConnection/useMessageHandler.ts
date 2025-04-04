
import { useCallback, useEffect, useRef } from "react";
import { WebRTCMessage, UseWebRTCConnectionOptions } from "./types";
import { WebRTCMessageHandler } from "@/utils/realtime/WebRTCMessageHandler";

/**
 * Hook to handle WebRTC messages and manage message handler state
 */
export function useMessageHandler(
  messageHandlerRef: React.MutableRefObject<WebRTCMessageHandler | null>,
  setMessages: React.Dispatch<React.SetStateAction<WebRTCMessage[]>>,
  setCurrentTranscript: React.Dispatch<React.SetStateAction<string>>,
  setTranscriptProgress: React.Dispatch<React.SetStateAction<number>>,
  setIsAiSpeaking: React.Dispatch<React.SetStateAction<boolean>>,
  options: UseWebRTCConnectionOptions
) {
  // Initialize the message handler if not already done
  useEffect(() => {
    if (!messageHandlerRef.current) {
      messageHandlerRef.current = new WebRTCMessageHandler({
        onTranscriptUpdate: (text) => {
          setCurrentTranscript(text);
          setTranscriptProgress(50); // Partial progress
        },
        onTranscriptComplete: () => {
          setTranscriptProgress(100); // Complete progress
        },
        onAudioData: (base64Audio) => {
          setIsAiSpeaking(true);
        },
        onAudioComplete: () => {
          setIsAiSpeaking(false);
        },
        onMessageReceived: (message) => {
          setMessages((prevMessages) => [...prevMessages, message]);
        },
        onFinalTranscript: (transcript) => {
          setCurrentTranscript(transcript);
          setTranscriptProgress(100);
        },
        instructions: options.instructions,
        userId: options.userId
      });
    }
  }, [
    messageHandlerRef, 
    setMessages, 
    setCurrentTranscript, 
    setTranscriptProgress,
    setIsAiSpeaking,
    options.instructions,
    options.userId
  ]);

  // Update message handler options when they change
  useEffect(() => {
    if (messageHandlerRef.current) {
      messageHandlerRef.current.updateOptions({
        instructions: options.instructions,
        userId: options.userId
      });
    }
  }, [messageHandlerRef, options.instructions, options.userId]);

  // Handle incoming WebRTC messages
  const handleMessage = useCallback((event: MessageEvent) => {
    try {
      console.log("[useMessageHandler] Received WebRTC message");
      
      if (messageHandlerRef.current) {
        messageHandlerRef.current.handleMessage(event);
      } else {
        console.warn("[useMessageHandler] Message handler not initialized");
      }
    } catch (error) {
      console.error("[useMessageHandler] Error handling message:", error);
    }
  }, [messageHandlerRef]);

  return { 
    handleMessage 
  };
}
