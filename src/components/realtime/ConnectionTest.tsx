
import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckCircle, XCircle, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

const ConnectionTest = () => {
  const [isConnecting, setIsConnecting] = useState(false);
  const [connectionResult, setConnectionResult] = useState<'success' | 'failure' | null>(null);
  const [message, setMessage] = useState<string>('');
  
  const testConnection = async () => {
    try {
      setIsConnecting(true);
      setConnectionResult(null);
      setMessage('');
      
      // Use the correct project ID
      const projectId = 'oseowhythgbqvllwonaz';
      const wsUrl = `wss://${projectId}.supabase.co/functions/v1/realtime-chat`;
      
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
        
        // Close the socket after successful test
        setTimeout(() => {
          socket.close();
        }, 1000);
        
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
        console.log("WebSocket closed:", event.code, event.reason);
        if (connectionResult !== 'success') {
          setConnectionResult('failure');
          setMessage(prev => `${prev}\nConnection closed: ${event.code} ${event.reason || 'No reason provided'}`);
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
  
  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>WebSocket Connection Test</CardTitle>
        <CardDescription>
          Test the connection to the Supabase Edge Function WebSocket endpoint
        </CardDescription>
      </CardHeader>
      <CardContent>
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
            <pre className="text-sm whitespace-pre-wrap">{message}</pre>
          </div>
        )}
      </CardContent>
      <CardFooter>
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
      </CardFooter>
    </Card>
  );
};

export default ConnectionTest;
