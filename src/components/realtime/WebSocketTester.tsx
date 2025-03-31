
import React, { useState, useEffect, useRef } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, CheckCircle, XCircle, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

const WebSocketTester = () => {
  const [isConnecting, setIsConnecting] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<'idle' | 'connecting' | 'connected' | 'failed'>('idle');
  const [messages, setMessages] = useState<string[]>([]);
  const [closeCode, setCloseCode] = useState<number | null>(null);
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
    setCloseCode(null);
    setMessages([]);
    
    try {
      // Close any existing connection
      closeConnection();
      
      // Get the project ID
      const projectId = 'oseowhythgbqvllwonaz';
      const wsUrl = `wss://${projectId}.supabase.co/functions/v1/websocket-test`;
      
      addMessage(`Connecting to: ${wsUrl}`);
      
      // Create a new WebSocket connection
      const socket = new WebSocket(wsUrl);
      socketRef.current = socket;
      
      addMessage(`Initial socket state: ${getReadyStateString(socket.readyState)}`);
      
      // Set up a connection timeout
      const timeoutId = setTimeout(() => {
        if (socket.readyState !== WebSocket.OPEN) {
          addMessage("Connection timed out after 10 seconds");
          socket.close();
          setConnectionStatus('failed');
          setIsConnecting(false);
          toast.error("WebSocket connection timed out");
        }
      }, 10000);
      
      socket.addEventListener('open', () => {
        clearTimeout(timeoutId);
        addMessage(`Connected successfully! Socket state: ${getReadyStateString(socket.readyState)}`);
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
        console.error("WebSocket error:", event);
        setConnectionStatus('failed');
        setIsConnecting(false);
      });
      
      socket.addEventListener('close', (event) => {
        clearTimeout(timeoutId);
        setCloseCode(event.code);
        addMessage(`Connection closed: ${event.code} ${event.reason || 'No reason provided'} (Clean: ${event.wasClean})`);
        setConnectionStatus('failed');
        setIsConnecting(false);
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

  // Render explanation for close code
  const renderCloseCodeExplanation = () => {
    if (!closeCode) return null;
    
    let explanation = "";
    switch (closeCode) {
      case 1000:
        explanation = "Normal closure - The connection was closed normally.";
        break;
      case 1001:
        explanation = "Going away - The server or client is going down or navigating away.";
        break;
      case 1002:
        explanation = "Protocol error - A protocol error was encountered.";
        break;
      case 1003:
        explanation = "Unsupported data - The endpoint received data in a format it cannot accept.";
        break;
      case 1006:
        explanation = "Abnormal closure - The connection was closed abnormally without a proper close frame being sent. This often indicates network issues or server-side problems.";
        break;
      case 1007:
        explanation = "Invalid frame payload data - The message contains invalid data.";
        break;
      case 1008:
        explanation = "Policy violation - The message violates a policy.";
        break;
      case 1009:
        explanation = "Message too big - The message is too large to process.";
        break;
      case 1011:
        explanation = "Internal error - The server encountered an unexpected condition.";
        break;
      case 1012:
        explanation = "Service restart - The server is restarting.";
        break;
      case 1013:
        explanation = "Try again later - The server is temporarily unavailable.";
        break;
      case 1015:
        explanation = "TLS handshake failure - The connection was closed due to a TLS handshake failure.";
        break;
      default:
        explanation = "Unknown close code.";
    }
    
    return (
      <Alert className="mt-4" variant={closeCode === 1000 ? "default" : "destructive"}>
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>WebSocket Close Code: {closeCode}</AlertTitle>
        <AlertDescription>{explanation}</AlertDescription>
      </Alert>
    );
  };
  
  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>WebSocket Test</CardTitle>
        <CardDescription>
          Tests a minimal WebSocket echo server to diagnose connection issues
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
        
        {renderCloseCodeExplanation()}
        
        {/* Troubleshooting tips */}
        {connectionStatus === 'failed' && (
          <div className="mt-4 p-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-900 rounded-md">
            <h3 className="font-medium text-amber-800 dark:text-amber-300">Troubleshooting Tips</h3>
            <ul className="mt-2 list-disc list-inside text-sm text-amber-700 dark:text-amber-400 space-y-1">
              <li>Check Edge Function logs for server-side errors</li>
              <li>Common issue: Network or proxy blocking WebSocket connections</li>
              <li>Verify CORS headers are properly set in Edge Function</li>
              <li>Code 1006 usually indicates network interruption before handshake completes</li>
            </ul>
          </div>
        )}
        
        {/* Message log */}
        <div className="mt-4 p-3 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-md h-60 overflow-auto">
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
