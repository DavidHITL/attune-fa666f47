
import React, { useState, useRef, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, CheckCircle, XCircle, Mic, MicOff, MessageSquare } from 'lucide-react';
import { toast } from 'sonner';
import { useDirectOpenAIConnection } from '@/hooks/useDirectOpenAIConnection';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

const DirectConnectionTester: React.FC = () => {
  const [message, setMessage] = useState<string>('');
  const [isRecording, setIsRecording] = useState<boolean>(false);
  const [logs, setLogs] = useState<string[]>([]);
  
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const processorRef = useRef<ScriptProcessorNode | null>(null);
  
  const {
    connectionStatus,
    transcript,
    isAISpeaking,
    error,
    connect,
    disconnect,
    sendMessage,
    processAudioInput
  } = useDirectOpenAIConnection();
  
  // Add log message
  const addLog = (message: string) => {
    setLogs(prev => [...prev, `[${new Date().toLocaleTimeString()}] ${message}`]);
  };
  
  // Handle connection
  const handleConnect = async () => {
    try {
      addLog("Connecting to OpenAI...");
      await connect("You are a helpful, friendly assistant. Keep your responses concise.");
    } catch (error) {
      addLog(`Connection failed: ${error instanceof Error ? error.message : String(error)}`);
      toast.error("Connection failed");
    }
  };
  
  // Handle disconnection
  const handleDisconnect = () => {
    disconnect();
    addLog("Disconnected from OpenAI");
    
    // Stop recording if active
    if (isRecording) {
      stopRecording();
    }
  };
  
  // Start microphone recording
  const startRecording = async () => {
    try {
      // Request microphone access
      mediaStreamRef.current = await navigator.mediaDevices.getUserMedia({
        audio: {
          sampleRate: 24000,
          channelCount: 1,
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        }
      });
      
      // Create audio context
      audioContextRef.current = new AudioContext({
        sampleRate: 24000,
      });
      
      // Create source and processor
      const source = audioContextRef.current.createMediaStreamSource(mediaStreamRef.current);
      processorRef.current = audioContextRef.current.createScriptProcessor(4096, 1, 1);
      
      // Handle audio data
      processorRef.current.onaudioprocess = (e) => {
        const inputData = e.inputBuffer.getChannelData(0);
        processAudioInput(new Float32Array(inputData));
      };
      
      // Connect nodes
      source.connect(processorRef.current);
      processorRef.current.connect(audioContextRef.current.destination);
      
      setIsRecording(true);
      addLog("Microphone recording started");
      toast.success("Microphone active");
      
    } catch (error) {
      console.error('Error accessing microphone:', error);
      addLog(`Microphone error: ${error instanceof Error ? error.message : String(error)}`);
      toast.error("Could not access microphone");
    }
  };
  
  // Stop microphone recording
  const stopRecording = () => {
    // Disconnect processor
    if (processorRef.current) {
      processorRef.current.disconnect();
      processorRef.current = null;
    }
    
    // Stop all tracks
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach(track => track.stop());
      mediaStreamRef.current = null;
    }
    
    // Close audio context
    if (audioContextRef.current) {
      audioContextRef.current.close();
      audioContextRef.current = null;
    }
    
    setIsRecording(false);
    addLog("Microphone recording stopped");
  };
  
  // Toggle recording
  const toggleRecording = () => {
    if (isRecording) {
      stopRecording();
    } else {
      startRecording();
    }
  };
  
  // Send text message
  const handleSendMessage = () => {
    if (!message.trim()) return;
    
    addLog(`Sending message: ${message}`);
    const success = sendMessage(message);
    
    if (success) {
      setMessage('');
      toast.success("Message sent");
    } else {
      toast.error("Failed to send message");
    }
  };
  
  // Update logs when connection status changes
  useEffect(() => {
    addLog(`Connection status: ${connectionStatus}`);
    
    if (connectionStatus === 'connected') {
      toast.success("Connected to OpenAI");
    } else if (connectionStatus === 'failed') {
      toast.error("Connection failed");
    }
  }, [connectionStatus]);
  
  // Update logs when transcript changes
  useEffect(() => {
    if (transcript) {
      addLog(`AI transcript: ${transcript}`);
    }
  }, [transcript]);
  
  // Update logs when AI speaking status changes
  useEffect(() => {
    if (isAISpeaking) {
      addLog("AI is speaking");
    }
  }, [isAISpeaking]);
  
  // Clean up on unmount
  useEffect(() => {
    return () => {
      disconnect();
      stopRecording();
    };
  }, []);
  
  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Direct OpenAI Connection Test</CardTitle>
        <CardDescription>
          Test direct WebRTC connection to OpenAI Realtime API
        </CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Connection status */}
        <div className="flex items-center gap-2 mb-4">
          <span className="font-medium">Status:</span>
          {connectionStatus === 'disconnected' && <span className="text-gray-500">Not connected</span>}
          {connectionStatus === 'connecting' && <span className="text-blue-500 flex items-center"><Loader2 className="h-4 w-4 mr-1 animate-spin" /> Connecting...</span>}
          {connectionStatus === 'connected' && <span className="text-green-500 flex items-center"><CheckCircle className="h-4 w-4 mr-1" /> Connected</span>}
          {connectionStatus === 'failed' && <span className="text-red-500 flex items-center"><XCircle className="h-4 w-4 mr-1" /> Failed</span>}
        </div>
        
        {/* Error message if any */}
        {error && (
          <Alert variant="destructive" className="mb-4">
            <XCircle className="h-4 w-4" />
            <AlertTitle>Connection Error</AlertTitle>
            <AlertDescription>{error.message}</AlertDescription>
          </Alert>
        )}
        
        {/* AI transcript */}
        {transcript && (
          <div className="p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-900 rounded-md">
            <h3 className="font-medium text-blue-800 dark:text-blue-300 mb-1">AI Response</h3>
            <p className="text-blue-700 dark:text-blue-400">{transcript}</p>
          </div>
        )}
        
        {/* Input area */}
        {connectionStatus === 'connected' && (
          <div className="space-y-2">
            <Textarea 
              placeholder="Type a message..." 
              value={message} 
              onChange={(e) => setMessage(e.target.value)} 
              className="min-h-[80px]"
            />
            
            <div className="flex justify-between">
              <Button
                type="button"
                variant={isRecording ? "destructive" : "outline"}
                onClick={toggleRecording}
                className="flex items-center gap-2"
              >
                {isRecording ? (
                  <>
                    <MicOff className="h-4 w-4" />
                    Stop Recording
                  </>
                ) : (
                  <>
                    <Mic className="h-4 w-4" />
                    Start Recording
                  </>
                )}
              </Button>
              
              <Button
                type="button"
                onClick={handleSendMessage}
                disabled={!message.trim()}
                className="flex items-center gap-2"
              >
                <MessageSquare className="h-4 w-4" />
                Send Message
              </Button>
            </div>
          </div>
        )}
        
        {/* Message log */}
        <div className="mt-4">
          <h3 className="text-sm font-medium mb-2">Event Log</h3>
          <div className="p-3 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-md h-48 overflow-auto">
            {logs.length === 0 ? (
              <div className="text-gray-400 italic">No events yet</div>
            ) : (
              <pre className="text-xs whitespace-pre-wrap font-mono">
                {logs.join('\n')}
              </pre>
            )}
          </div>
        </div>
      </CardContent>
      
      <CardFooter className="flex justify-between">
        <Button 
          onClick={handleConnect} 
          disabled={connectionStatus === 'connecting' || connectionStatus === 'connected'}
          variant={connectionStatus === 'connected' ? "outline" : "default"}
        >
          {connectionStatus === 'connecting' ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Connecting...
            </>
          ) : connectionStatus === 'connected' ? (
            'Reconnect'
          ) : (
            'Connect'
          )}
        </Button>
        
        <Button 
          onClick={handleDisconnect}
          disabled={connectionStatus !== 'connected'}
          variant="destructive"
        >
          Disconnect
        </Button>
      </CardFooter>
    </Card>
  );
};

export default DirectConnectionTester;
