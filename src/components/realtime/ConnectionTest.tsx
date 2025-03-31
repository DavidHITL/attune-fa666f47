
import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckCircle, XCircle, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

const ConnectionTest = () => {
  const [isConnecting, setIsConnecting] = useState(false);
  const [isOpenAITesting, setIsOpenAITesting] = useState(false);
  const [connectionResult, setConnectionResult] = useState<'success' | 'failure' | null>(null);
  const [openAIResult, setOpenAIResult] = useState<'success' | 'failure' | null>(null);
  const [message, setMessage] = useState<string>('');
  const [openAIMessage, setOpenAIMessage] = useState<string>('');
  
  // Test WebSocket connection to Supabase
  const testConnection = async () => {
    try {
      setIsConnecting(true);
      setConnectionResult(null);
      setMessage('');
      
      // Use the correct project ID
      const projectId = window.location.hostname.split('.')[0];
      const wsUrl = `wss://${projectId}.functions.supabase.co/functions/v1/realtime-chat`;
      
      console.log("Testing WebSocket connection to:", wsUrl);
      toast.info(`Connecting to ${wsUrl}`);
      
      // Create a WebSocket connection
      const socket = new WebSocket(wsUrl);
      
      // Set up a timeout
      const timeoutId = setTimeout(() => {
        if (socket.readyState !== WebSocket.OPEN) {
          socket.close();
          setConnectionResult('failure');
          setMessage('Connection timed out after 5 seconds');
          toast.error('Connection timed out');
          setIsConnecting(false);
        }
      }, 5000);
      
      socket.addEventListener('open', () => {
        clearTimeout(timeoutId);
        console.log("WebSocket connection established");
        setConnectionResult('success');
        setMessage('WebSocket connection established successfully!');
        toast.success('WebSocket connection successful');
        
        // Try to ping the server
        try {
          socket.send(JSON.stringify({ type: 'ping', timestamp: new Date().toISOString() }));
        } catch (e) {
          console.error("Error sending ping:", e);
          setMessage(prev => `${prev}\nFailed to send ping: ${e}`);
        }
        
        // Close the socket after successful test
        setTimeout(() => {
          socket.close();
        }, 2000);
        
        setIsConnecting(false);
      });
      
      socket.addEventListener('error', (event) => {
        clearTimeout(timeoutId);
        console.error("WebSocket error:", event);
        setConnectionResult('failure');
        setMessage('Error establishing WebSocket connection');
        toast.error('WebSocket connection failed');
        setIsConnecting(false);
      });
      
      socket.addEventListener('message', (event) => {
        try {
          const data = JSON.parse(event.data);
          console.log("Received message from WebSocket:", data);
          setMessage(prev => `${prev}\nReceived: ${JSON.stringify(data)}`);
        } catch (e) {
          console.log("Received raw message:", event.data);
          setMessage(prev => `${prev}\nReceived raw: ${event.data}`);
        }
      });
      
      socket.addEventListener('close', (event) => {
        clearTimeout(timeoutId);
        console.log("WebSocket closed:", event.code, event.reason);
        if (connectionResult !== 'success') {
          setConnectionResult('failure');
          setMessage(prev => `${prev}\nConnection closed: ${event.code} ${event.reason || 'No reason provided'}`);
        } else {
          setMessage(prev => `${prev}\nConnection closed normally: ${event.code}`);
        }
        setIsConnecting(false);
      });
      
    } catch (error) {
      console.error("Error testing connection:", error);
      setConnectionResult('failure');
      setMessage(`Error: ${error instanceof Error ? error.message : String(error)}`);
      toast.error('Error testing connection');
      setIsConnecting(false);
    }
  };

  // Test connection to OpenAI through ephemeral key service
  const testOpenAIConnection = async () => {
    try {
      setIsOpenAITesting(true);
      setOpenAIResult(null);
      setOpenAIMessage('');
      
      console.log("Testing OpenAI connection through ephemeral key service");
      toast.info('Testing connection to OpenAI');
      
      const response = await fetch('/api/test-openai-connection', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      const data = await response.json();
      console.log("OpenAI test response:", data);
      
      if (response.ok) {
        setOpenAIResult('success');
        setOpenAIMessage(`OpenAI connection test successful!\n${JSON.stringify(data, null, 2)}`);
        toast.success('OpenAI connection test successful');
      } else {
        setOpenAIResult('failure');
        setOpenAIMessage(`OpenAI connection test failed: ${data.error || 'Unknown error'}`);
        toast.error(`OpenAI test failed: ${data.error || 'Unknown error'}`);
      }
    } catch (error) {
      console.error("Error testing OpenAI connection:", error);
      setOpenAIResult('failure');
      setOpenAIMessage(`Error: ${error instanceof Error ? error.message : String(error)}`);
      toast.error('Error testing OpenAI connection');
    } finally {
      setIsOpenAITesting(false);
    }
  };
  
  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>WebRTC Connection Test</CardTitle>
        <CardDescription>
          Test the connection components for WebRTC functionality
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* WebSocket Connection Test */}
        <div className="space-y-4">
          <h3 className="text-lg font-medium">WebSocket Connection Test</h3>
          
          {connectionResult === 'success' && (
            <Alert className="mb-4 bg-green-50 border-green-200">
              <CheckCircle className="h-4 w-4 text-green-500" />
              <AlertTitle className="text-green-700">Connection Successful</AlertTitle>
              <AlertDescription className="text-green-600">
                Successfully connected to the WebSocket endpoint.
              </AlertDescription>
            </Alert>
          )}
          {connectionResult === 'failure' && (
            <Alert className="mb-4 bg-red-50 border-red-200">
              <XCircle className="h-4 w-4 text-red-500" />
              <AlertTitle className="text-red-700">Connection Failed</AlertTitle>
              <AlertDescription className="text-red-600">
                Failed to connect to the WebSocket endpoint.
              </AlertDescription>
            </Alert>
          )}
          
          {message && (
            <div className="mt-4 p-3 bg-gray-50 border border-gray-200 rounded-md">
              <pre className="text-sm whitespace-pre-wrap overflow-auto max-h-60">{message}</pre>
            </div>
          )}
          
          <Button 
            onClick={testConnection} 
            disabled={isConnecting}
            className="w-full"
          >
            {isConnecting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Connecting...
              </>
            ) : (
              'Test WebSocket Connection'
            )}
          </Button>
        </div>
        
        {/* OpenAI Connection Test */}
        <div className="space-y-4 border-t pt-4">
          <h3 className="text-lg font-medium">OpenAI Connection Test</h3>
          
          {openAIResult === 'success' && (
            <Alert className="mb-4 bg-green-50 border-green-200">
              <CheckCircle className="h-4 w-4 text-green-500" />
              <AlertTitle className="text-green-700">OpenAI Connection Successful</AlertTitle>
              <AlertDescription className="text-green-600">
                Successfully connected to OpenAI API.
              </AlertDescription>
            </Alert>
          )}
          {openAIResult === 'failure' && (
            <Alert className="mb-4 bg-red-50 border-red-200">
              <XCircle className="h-4 w-4 text-red-500" />
              <AlertTitle className="text-red-700">OpenAI Connection Failed</AlertTitle>
              <AlertDescription className="text-red-600">
                Failed to connect to OpenAI API.
              </AlertDescription>
            </Alert>
          )}
          
          {openAIMessage && (
            <div className="mt-4 p-3 bg-gray-50 border border-gray-200 rounded-md">
              <pre className="text-sm whitespace-pre-wrap overflow-auto max-h-60">{openAIMessage}</pre>
            </div>
          )}
          
          <Button 
            onClick={testOpenAIConnection} 
            disabled={isOpenAITesting}
            variant="secondary"
            className="w-full"
          >
            {isOpenAITesting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Testing OpenAI Connection...
              </>
            ) : (
              'Test OpenAI Connection'
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default ConnectionTest;
