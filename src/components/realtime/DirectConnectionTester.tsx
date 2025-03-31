
import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { MessageSquare } from 'lucide-react';
import { toast } from 'sonner';
import { useDirectOpenAIConnection } from '@/hooks/useDirectOpenAIConnection';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { XCircle } from 'lucide-react';
import { useAudioRecording } from '@/hooks/useAudioRecording';
import ConnectionStatus from './ConnectionStatus';
import EventLog from './EventLog';

const DirectConnectionTester: React.FC = () => {
  const [message, setMessage] = useState<string>('');
  const [logs, setLogs] = useState<string[]>([]);
  
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

  const { isRecording, startRecording, stopRecording } = useAudioRecording({
    onAudioData: processAudioInput
  });
  
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
  
  // Toggle recording
  const toggleRecording = () => {
    if (isRecording) {
      stopRecording();
      addLog("Microphone recording stopped");
    } else {
      startRecording();
      addLog("Microphone recording started");
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
      if (isRecording) {
        stopRecording();
      }
    };
  }, []);
  
  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>OpenAI Realtime API Connection</CardTitle>
        <CardDescription>
          Test direct WebRTC connection to OpenAI Realtime API
        </CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Connection status */}
        <ConnectionStatus status={connectionStatus} error={error} />
        
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
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-mic-off h-4 w-4">
                      <line x1="2" x2="22" y1="2" y2="22"></line>
                      <path d="M18.89 13.23A7.12 7.12 0 0 0 19 12v-2"></path>
                      <path d="M5 10v2a7 7 0 0 0 12 5"></path>
                      <path d="M15 9.34V5a3 3 0 0 0-5.68-1.33"></path>
                      <path d="M9 9v3a3 3 0 0 0 5.12 2.12"></path>
                    </svg>
                    Stop Recording
                  </>
                ) : (
                  <>
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-mic h-4 w-4">
                      <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z"></path>
                      <path d="M19 10v2a7 7 0 0 1-14 0v-2"></path>
                      <line x1="12" x2="12" y1="19" y2="22"></line>
                    </svg>
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
        <EventLog logs={logs} />
      </CardContent>
      
      <CardFooter className="flex justify-between">
        <Button 
          onClick={handleConnect} 
          disabled={connectionStatus === 'connecting' || connectionStatus === 'connected'}
          variant={connectionStatus === 'connected' ? "outline" : "default"}
        >
          {connectionStatus === 'connecting' ? (
            <>
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-loader-2 mr-2 h-4 w-4 animate-spin">
                <path d="M21 12a9 9 0 1 1-6.219-8.56"></path>
              </svg>
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
