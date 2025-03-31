
import { useState, useEffect, useRef } from 'react';
import { DirectOpenAIConnection } from '@/utils/realtime/DirectOpenAIConnection';
import { RealtimeEvent } from '@/utils/realtime/DirectOpenAIConnection';
import { useAudioRecording } from './useAudioRecording';
import { toast } from 'sonner';

export function useVoiceChat(user: any) {
  const [transcript, setTranscript] = useState("");
  const [messages, setMessages] = useState<any[]>([]);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const chatRef = useRef<DirectOpenAIConnection | null>(null);
  const unsubscribeRef = useRef<(() => void) | null>(null);
  
  // Initialize chat connection
  useEffect(() => {
    chatRef.current = new DirectOpenAIConnection();
    
    return () => {
      if (unsubscribeRef.current) {
        unsubscribeRef.current();
        unsubscribeRef.current = null;
      }
      
      if (chatRef.current) {
        chatRef.current.disconnect();
      }
    };
  }, []);
  
  // Audio recording handler
  const { isRecording, startRecording, stopRecording } = useAudioRecording({
    onAudioData: (audioData) => {
      if (chatRef.current && chatRef.current.isConnectedToOpenAI()) {
        chatRef.current.sendAudioData(audioData);
      }
    }
  });
  
  // Connect to OpenAI
  const connect = async () => {
    try {
      if (!chatRef.current) {
        chatRef.current = new DirectOpenAIConnection();
      }
      
      // Configure event listener for transcript updates
      if (unsubscribeRef.current) {
        unsubscribeRef.current();
      }
      
      unsubscribeRef.current = chatRef.current.addEventListener((event: RealtimeEvent) => {
        if (event.type === 'transcript') {
          setTranscript(event.text);
        } else if (event.type === 'audio') {
          setIsSpeaking(true);
          
          // Clear timeout from any previous audio event
          const timeoutId = setTimeout(() => {
            setIsSpeaking(false);
          }, 1000);
          
          return () => clearTimeout(timeoutId);
        }
      });
      
      // Connect to OpenAI
      const customInstructions = 
        "You are a friendly, helpful, and concise voice assistant. " +
        "Keep your responses brief but informative. " + 
        "Be conversational but direct. Avoid unnecessarily long explanations.";
        
      await chatRef.current.connect(customInstructions, "alloy");
      
      // Add initial system message
      setMessages([
        {
          id: "system-welcome",
          role: "assistant",
          text: "Hi! How can I help you today?",
          timestamp: new Date()
        }
      ]);
      
    } catch (error) {
      console.error("[useVoiceChat] Connection error:", error);
      toast.error("Failed to connect to voice service");
      throw error;
    }
  };
  
  // Disconnect from OpenAI
  const disconnect = () => {
    if (chatRef.current) {
      chatRef.current.disconnect();
    }
    
    if (isRecording) {
      stopRecording();
    }
    
    setTranscript("");
  };
  
  // Send message
  const sendMessage = (text: string) => {
    if (!chatRef.current || !chatRef.current.isConnectedToOpenAI()) {
      toast.error("Not connected to voice service");
      return;
    }
    
    // Add user message
    setMessages(prev => [
      ...prev,
      {
        id: `user-${Date.now()}`,
        role: "user",
        text,
        timestamp: new Date()
      }
    ]);
    
    // Send to OpenAI
    chatRef.current.sendTextMessage(text);
    
    // Clear transcript
    setTranscript("");
  };
  
  // Add assistant message when transcript is finalized
  useEffect(() => {
    if (!isSpeaking && transcript && chatRef.current?.isConnectedToOpenAI()) {
      // Check if the transcript is different from the last assistant message
      const lastMessage = messages[messages.length - 1];
      if (lastMessage?.role !== "assistant" || lastMessage?.text !== transcript) {
        // Add assistant message
        setMessages(prev => [
          ...prev,
          {
            id: `assistant-${Date.now()}`,
            role: "assistant",
            text: transcript,
            timestamp: new Date()
          }
        ]);
        
        // Clear transcript for the next exchange
        setTranscript("");
      }
    }
  }, [isSpeaking, transcript, messages]);
  
  return {
    transcript,
    setTranscript,
    messages,
    isRecording,
    isSpeaking,
    startRecording,
    stopRecording,
    sendMessage,
    chatRef,
    connect,
    disconnect
  };
}
