
import { useState, useEffect, useRef } from 'react';
import { DirectOpenAIConnection, RealtimeEvent } from '@/utils/realtime/DirectOpenAIConnection';

export function useDirectOpenAIConnection() {
  const [connectionStatus, setConnectionStatus] = useState<'disconnected' | 'connecting' | 'connected' | 'failed'>('disconnected');
  const [transcript, setTranscript] = useState<string>('');
  const [isAISpeaking, setIsAISpeaking] = useState<boolean>(false);
  const [error, setError] = useState<Error | null>(null);
  
  const connectionRef = useRef<DirectOpenAIConnection | null>(null);
  const audioBufferRef = useRef<Float32Array[]>([]);
  const audioProcessingRef = useRef<boolean>(false);
  const unsubscribeRef = useRef<(() => void) | null>(null);
  
  // Initialize connection
  useEffect(() => {
    connectionRef.current = new DirectOpenAIConnection();
    
    // Set up event listener
    unsubscribeRef.current = connectionRef.current.addEventListener((event) => {
      switch (event.type) {
        case 'connection':
          setConnectionStatus(event.state);
          if (event.error) {
            setError(event.error);
          }
          break;
          
        case 'transcript':
          setTranscript(event.text);
          break;
          
        case 'audio':
          // Queue audio data
          audioBufferRef.current.push(event.data);
          processAudioBuffer();
          setIsAISpeaking(true);
          
          // Set timeout to detect end of speech
          const speakingTimeout = setTimeout(() => {
            setIsAISpeaking(false);
          }, 1000);
          
          return () => clearTimeout(speakingTimeout);
      }
    });
    
    // Clean up on unmount
    return () => {
      if (unsubscribeRef.current) {
        unsubscribeRef.current();
      }
      
      if (connectionRef.current) {
        connectionRef.current.disconnect();
      }
    };
  }, []);
  
  // Function to play queued audio data
  const processAudioBuffer = () => {
    if (audioProcessingRef.current || audioBufferRef.current.length === 0) {
      return;
    }
    
    audioProcessingRef.current = true;
    
    // Get first item from queue
    const audioData = audioBufferRef.current.shift();
    
    // Create audio context
    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    
    // Create buffer
    const buffer = audioContext.createBuffer(1, audioData!.length, 24000);
    const channel = buffer.getChannelData(0);
    
    // Copy data to channel
    channel.set(audioData!);
    
    // Create source and play
    const source = audioContext.createBufferSource();
    source.buffer = buffer;
    source.connect(audioContext.destination);
    
    source.onended = () => {
      audioProcessingRef.current = false;
      audioContext.close();
      
      // Process next item if available
      if (audioBufferRef.current.length > 0) {
        processAudioBuffer();
      }
    };
    
    source.start();
  };
  
  // Connect to OpenAI
  const connect = async (instructions = "You are a helpful AI assistant.", voice = "alloy") => {
    try {
      if (!connectionRef.current) {
        connectionRef.current = new DirectOpenAIConnection();
      }
      
      await connectionRef.current.connect(instructions, voice);
    } catch (err) {
      console.error("Connection error:", err);
    }
  };
  
  // Disconnect from OpenAI
  const disconnect = () => {
    if (connectionRef.current) {
      connectionRef.current.disconnect();
    }
  };
  
  // Send text message to OpenAI
  const sendMessage = (text: string): boolean => {
    if (connectionRef.current && connectionRef.current.isConnectedToOpenAI()) {
      return connectionRef.current.sendTextMessage(text);
    }
    return false;
  };
  
  // Process audio data from microphone
  const processAudioInput = (audioData: Float32Array): boolean => {
    if (connectionRef.current && connectionRef.current.isConnectedToOpenAI()) {
      return connectionRef.current.sendAudioData(audioData);
    }
    return false;
  };
  
  return {
    connectionStatus,
    transcript,
    isAISpeaking,
    error,
    connect,
    disconnect,
    sendMessage,
    processAudioInput
  };
}
