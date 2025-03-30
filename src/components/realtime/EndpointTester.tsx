
import React from 'react';
import { useEndpointTest } from '@/hooks/useEndpointTest';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, CheckCircle2, XCircle, Globe, Radio } from 'lucide-react';

const EndpointTester: React.FC = () => {
  const {
    testHttpEndpoint,
    testWsEndpoint,
    disconnectWs,
    isTestingHttp,
    isTestingWs,
    httpResult,
    wsResult,
    hasActiveWsConnection
  } = useEndpointTest();

  return (
    <Card className="w-full shadow-md">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Globe size={18} /> Realtime API Endpoint Diagnostics
        </CardTitle>
        <CardDescription>
          Test the reachability of your Supabase Edge Function for the realtime API
        </CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-6">
        {/* HTTP Test Section */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-medium">HTTP Endpoint Test</h3>
            <Button
              variant="outline"
              size="sm"
              onClick={testHttpEndpoint}
              disabled={isTestingHttp}
            >
              {isTestingHttp ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Testing...
                </>
              ) : (
                'Test HTTP Endpoint'
              )}
            </Button>
          </div>
          
          {httpResult && (
            <Alert variant={httpResult.includes('Error') ? "destructive" : "default"}>
              <AlertDescription className="font-mono text-xs whitespace-pre-wrap">
                {httpResult}
              </AlertDescription>
            </Alert>
          )}
        </div>
        
        {/* WebSocket Test Section */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-medium flex items-center gap-2">
              <Radio size={16} className={hasActiveWsConnection ? "text-green-500 animate-pulse" : "text-gray-400"} />
              WebSocket Connection Test
            </h3>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={testWsEndpoint}
                disabled={isTestingWs || hasActiveWsConnection}
              >
                {isTestingWs ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Connecting...
                  </>
                ) : (
                  'Test WebSocket'
                )}
              </Button>
              
              {hasActiveWsConnection && (
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={disconnectWs}
                >
                  Disconnect
                </Button>
              )}
            </div>
          </div>
          
          {wsResult && (
            <Alert variant={wsResult.includes('Error') ? "destructive" : "default"}>
              <AlertDescription className="font-mono text-xs whitespace-pre-wrap">
                {wsResult}
              </AlertDescription>
            </Alert>
          )}
          
          {hasActiveWsConnection && (
            <div className="p-2 bg-green-50 dark:bg-green-900/30 rounded border border-green-200 dark:border-green-900 flex items-center gap-2">
              <CheckCircle2 className="text-green-500 h-5 w-5" />
              <span className="text-sm text-green-700 dark:text-green-300">
                WebSocket connection attempt in progress. Check browser console for connection status.
              </span>
            </div>
          )}
        </div>
      </CardContent>
      
      <CardFooter className="border-t pt-4 text-xs text-gray-500">
        The HTTP test verifies if the Edge Function is deployed and responding.
        The WebSocket test checks if WebSocket connections can be established.
      </CardFooter>
    </Card>
  );
};

export default EndpointTester;
