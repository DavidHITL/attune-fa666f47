
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
      addMessage("Connection closed manually");
    }
  };
  
  // Clean up on unmount
  useEffect(() => {
    return () => closeConnection();
  }, []);
  
  const connectToTestEndpoint = () => {
    setIsConnecting(true);
    setConnectionStatus('connecting');
    
    try {
      // Close any existing connection
      closeConnection();
      
      // Get the project ID
      const projectId = 'oseowhythgbqvllwonaz';
      const wsUrl = `wss://${projectId}.supabase.co/functions/v1/websocket-test`;
      
      addMessage(`Connecting to: ${wsUrl}`);
      addMessage(`Browser WebSocket support: ${typeof WebSocket !== 'undefined' ? 'Available' : 'Not Available'}`);
      
      // Create a new WebSocket connection WITHOUT any protocols
      const socket = new WebSocket(wsUrl);
      socketRef.current = socket;
      
      // Log the WebSocket readyState
      addMessage(`Initial socket state: ${getReadyStateString(socket.readyState)}`);
      
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
        addMessage(`Connected! Socket open. ReadyState: ${getReadyStateString(socket.readyState)}`);
        setConnectionStatus('connected');
        toast.success("WebSocket connected successfully");
        setIsConnecting(false);
        
        // Send a test message
        try {
          socket.send("Hello from WebSocketTester!");
          addMessage("Sent: Hello from WebSocketTester!");
        } catch (sendError) {
          addMessage(`Error sending test message: ${sendError}`);
        }
      });
      
      socket.addEventListener('message', (event) => {
        addMessage(`Received: ${event.data}`);
      });
      
      socket.addEventListener('error', (event) => {
        addMessage(`WebSocket error occurred`);
        setConnectionStatus('failed');
        setIsConnecting(false);
      });
      
      socket.addEventListener('close', (event) => {
        clearTimeout(timeoutId);
        addMessage(`Connection closed: ${event.code} ${event.reason || 'No reason'} (Clean: ${event.wasClean})`);
        setConnectionStatus(event.wasClean ? 'idle' : 'failed');
        setIsConnecting(false);
        
        // Add detailed explanation for common close codes
        if (event.code === 1006) {
          addMessage("Code 1006: Abnormal closure - Connection was closed abnormally, without a proper close frame being sent.");
        } else if (event.code === 1001) {
          addMessage("Code 1001: Going away - The server is going down or the browser is navigating away.");
        } else if (event.code === 1002) {
          addMessage("Code 1002: Protocol error - Endpoint is terminating the connection due to a protocol error.");
        } else if (event.code === 1009) {
          addMessage("Code 1009: Message too big - Data frame was too large.");
        } else if (event.code === 1011) {
          addMessage("Code 1011: Internal error - Server encountered an unexpected condition.");
        }
      });
    } catch (error) {
      addMessage(`Error creating WebSocket: ${error instanceof Error ? error.message : String(error)}`);
      setConnectionStatus('failed');
      setIsConnecting(false);
      toast.error("Failed to create WebSocket connection");
    }
  };
  
  const sendTestMessage = () => {
    if (socketRef.current && socketRef.current.readyState === WebSocket.OPEN) {
      const message = `Ping ${new Date().toISOString()}`;
      try {
        socketRef.current.send(message);
        addMessage(`Sent: ${message}`);
      } catch (error) {
        addMessage(`Error sending message: ${error instanceof Error ? error.message : String(error)}`);
      }
    } else {
      toast.error("WebSocket is not connected");
      addMessage("Cannot send - WebSocket is not connected");
    }
  };
  
  // Helper to get readable WebSocket state
  const getReadyStateString = (state: number): string => {
    switch (state) {
      case 0: return "CONNECTING (0)";
      case 1: return "OPEN (1)";
      case 2: return "CLOSING (2)";
      case 3: return "CLOSED (3)";
      default: return `UNKNOWN (${state})`;
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
