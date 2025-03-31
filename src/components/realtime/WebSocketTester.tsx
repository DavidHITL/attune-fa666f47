
import React, { useState, useEffect, useRef } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, CheckCircle, XCircle } from 'lucide-react';
import { toast } from 'sonner';

const WebSocketTester = () => {
  const [isConnecting, setIsConnecting] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<'idle' | 'connecting' | 'connected' | 'failed'>('idle');
  const [messages, setMessages] = useState<string[]>([]);
  const socketRef = useRef<WebSocket | null>(null);
  
  // Cleanup function for the WebSocket connection
  const closeConnection = () => {
    if (socketRef.current) {
      if (socketRef.current.readyState === WebSocket.OPEN || 
          socketRef.current.readyState === WebSocket.CONNECTING) {
        socketRef.current.close();
      }
      socketRef.current = null;
      setConnectionStatus('idle');
      console.log("WebSocket connection closed");
    }
  };
  
  // Clean up on unmount
  useEffect(() => {
    return () => closeConnection();
  }, []);
  
  const connectToTestEndpoint = () => {
    setIsConnecting(true);
    setConnectionStatus('connecting');
    setMessages([]);
    
    try {
      // Close any existing connection
      closeConnection();
      
      // Get the project ID
      const projectId = 'oseowhythgbqvllwonaz';
      const wsUrl = `wss://${projectId}.supabase.co/functions/v1/websocket-test`;
      
      console.log("Connecting to WebSocket test endpoint:", wsUrl);
      addMessage(`Connecting to: ${wsUrl}`);
      
      // Create a new WebSocket connection
      const socket = new WebSocket(wsUrl);
      socketRef.current = socket;
      
      // Set up a connection timeout
      const timeoutId = setTimeout(() => {
        if (socket.readyState !== WebSocket.OPEN) {
          addMessage("Connection timed out after 5 seconds");
          socket.close();
          setConnectionStatus('failed');
          setIsConnecting(false);
          toast.error("WebSocket connection timed out");
        }
      }, 5000);
      
      socket.addEventListener('open', () => {
        clearTimeout(timeoutId);
        console.log("WebSocket connection established");
        addMessage("Connected! Socket open.");
        setConnectionStatus('connected');
        toast.success("WebSocket connected successfully");
        setIsConnecting(false);
        
        // Send a test message
        socket.send("Hello from WebSocketTester!");
      });
      
      socket.addEventListener('message', (event) => {
        console.log("Received message:", event.data);
        addMessage(`Received: ${event.data}`);
      });
      
      socket.addEventListener('error', (event) => {
        console.error("WebSocket error:", event);
        addMessage(`Error: ${JSON.stringify(event)}`);
        toast.error("WebSocket connection error");
        setConnectionStatus('failed');
        setIsConnecting(false);
      });
      
      socket.addEventListener('close', (event) => {
        clearTimeout(timeoutId);
        console.log("WebSocket closed:", event.code, event.reason);
        addMessage(`Connection closed: ${event.code} ${event.reason || 'No reason'} (Clean: ${event.wasClean})`);
        setConnectionStatus(event.wasClean ? 'idle' : 'failed');
        setIsConnecting(false);
      });
    } catch (error) {
      console.error("Error creating WebSocket:", error);
      addMessage(`Error: ${error instanceof Error ? error.message : String(error)}`);
      setConnectionStatus('failed');
      setIsConnecting(false);
      toast.error("Failed to create WebSocket connection");
    }
  };
  
  const sendTestMessage = () => {
    if (socketRef.current && socketRef.current.readyState === WebSocket.OPEN) {
      const message = `Ping ${new Date().toISOString()}`;
      socketRef.current.send(message);
      addMessage(`Sent: ${message}`);
    } else {
      toast.error("WebSocket is not connected");
      addMessage("Cannot send - WebSocket is not connected");
    }
  };
  
  const addMessage = (message: string) => {
    setMessages(prev => [...prev, `[${new Date().toLocaleTimeString()}] ${message}`]);
  };
  
  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Minimal WebSocket Test</CardTitle>
        <CardDescription>
          Tests a minimal WebSocket echo server to isolate connection issues
        </CardDescription>
      </CardHeader>
      <CardContent>
        {/* Status indicator */}
        <div className="mb-4 flex items-center gap-2">
          <span className="font-medium">Status:</span>
          {connectionStatus === 'idle' && <span className="text-gray-500">Not connected</span>}
          {connectionStatus === 'connecting' && <span className="text-blue-500 flex items-center"><Loader2 className="h-4 w-4 mr-1 animate-spin" /> Connecting...</span>}
          {connectionStatus === 'connected' && <span className="text-green-500 flex items-center"><CheckCircle className="h-4 w-4 mr-1" /> Connected</span>}
          {connectionStatus === 'failed' && <span className="text-red-500 flex items-center"><XCircle className="h-4 w-4 mr-1" /> Failed</span>}
        </div>
        
        {/* Message log */}
        <div className="mt-4 p-3 bg-gray-50 border border-gray-200 rounded-md h-60 overflow-auto">
          {messages.length === 0 ? (
            <div className="text-gray-400 italic">No messages yet</div>
          ) : (
            <pre className="text-xs whitespace-pre-wrap font-mono">
              {messages.join('\n')}
            </pre>
          )}
        </div>
      </CardContent>
      <CardFooter className="flex justify-between">
        <Button 
          onClick={connectToTestEndpoint} 
          disabled={isConnecting || connectionStatus === 'connecting'}
          variant={connectionStatus === 'connected' ? "outline" : "default"}
        >
          {isConnecting ? (
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
        
        <div className="flex gap-2">
          <Button 
            onClick={sendTestMessage}
            disabled={connectionStatus !== 'connected'}
            variant="outline"
          >
            Send Test Message
          </Button>
          
          <Button 
            onClick={closeConnection}
            disabled={connectionStatus !== 'connected'}
            variant="destructive"
          >
            Close Connection
          </Button>
        </div>
      </CardFooter>
    </Card>
  );
};

export default WebSocketTester;
