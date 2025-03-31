
import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Wifi, WifiOff, CheckCircle2, Loader2 } from 'lucide-react';
import { testWebSocketConnection } from '@/utils/realtime/testWebSocketConnection';
import { toast } from 'sonner';
import DirectConnectionTester from './DirectConnectionTester';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const WebSocketTester: React.FC = () => {
  const [status, setStatus] = useState<'idle' | 'testing' | 'success' | 'failed'>('idle');
  const [message, setMessage] = useState<string>('');
  const [activeConnection, setActiveConnection] = useState<{ close: () => void } | null>(null);
  
  const handleTest = async () => {
    try {
      setStatus('testing');
      setMessage('');
      
      // Close any existing connection
      if (activeConnection) {
        activeConnection.close();
        setActiveConnection(null);
      }
      
      toast.info("Testing WebSocket connection...");
      const result = await testWebSocketConnection();
      
      if (result.success) {
        setStatus('success');
        toast.success("WebSocket connection successful!");
        setMessage(result.message);
        setActiveConnection(result);
      } else {
        setStatus('failed');
        toast.error("WebSocket connection failed!");
        setMessage(result.message);
      }
    } catch (error) {
      setStatus('failed');
      toast.error("WebSocket test error");
      setMessage(error instanceof Error ? error.message : String(error));
    }
  };
  
  const handleDisconnect = () => {
    if (activeConnection) {
      activeConnection.close();
      setActiveConnection(null);
      setStatus('idle');
      setMessage('');
      toast.info("Connection closed");
    }
  };
  
  return (
    <div className="space-y-6">
      <Tabs defaultValue="edge-function" className="w-full">
        <TabsList className="grid grid-cols-2">
          <TabsTrigger value="edge-function">Edge Function Test</TabsTrigger>
          <TabsTrigger value="direct-openai">Direct OpenAI Test</TabsTrigger>
        </TabsList>
        
        <TabsContent value="edge-function" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>WebSocket Connection Test</CardTitle>
              <CardDescription>
                Test the WebSocket connection to the Supabase Edge Function.
              </CardDescription>
            </CardHeader>
            
            <CardContent className="space-y-4">
              <div className="flex items-center">
                <span className="text-sm font-medium mr-2">Status:</span>
                
                {status === 'idle' && (
                  <Badge variant="outline" className="bg-slate-50 text-slate-700 border-slate-200">
                    Not Connected
                  </Badge>
                )}
                
                {status === 'testing' && (
                  <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200 flex items-center gap-1.5">
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    <span>Testing...</span>
                  </Badge>
                )}
                
                {status === 'success' && (
                  <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200 flex items-center gap-1.5">
                    <CheckCircle2 className="h-3.5 w-3.5" />
                    <span>Connected</span>
                  </Badge>
                )}
                
                {status === 'failed' && (
                  <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200 flex items-center gap-1.5">
                    <WifiOff className="h-3.5 w-3.5" />
                    <span>Connection Failed</span>
                  </Badge>
                )}
              </div>
              
              {message && (
                <Alert variant={status === 'failed' ? "destructive" : "default"} className="text-sm">
                  <AlertTitle>{status === 'success' ? "Success" : "Error"}</AlertTitle>
                  <AlertDescription>{message}</AlertDescription>
                </Alert>
              )}
            </CardContent>
            
            <CardFooter className="flex justify-between">
              <div className="text-xs text-gray-500">
                {status === 'success' && <p>Connection will automatically close after 2 minutes of inactivity</p>}
              </div>
              
              <div className="space-x-2">
                {status === 'success' && (
                  <Button variant="outline" onClick={handleDisconnect}>
                    Disconnect
                  </Button>
                )}
                
                <Button 
                  onClick={handleTest} 
                  disabled={status === 'testing'}
                >
                  {status === 'testing' ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Testing...
                    </>
                  ) : (
                    'Test Connection'
                  )}
                </Button>
              </div>
            </CardFooter>
          </Card>
        </TabsContent>
        
        <TabsContent value="direct-openai" className="mt-4">
          <DirectConnectionTester />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default WebSocketTester;
