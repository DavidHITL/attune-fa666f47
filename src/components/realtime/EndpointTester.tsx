
import React, { useState } from 'react';
import { useEndpointTest } from '@/hooks/useEndpointTest';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { CheckCircle2, XCircle, Globe, Radio, Loader2, AlertTriangle, Info } from 'lucide-react';
import { Separator } from '@/components/ui/separator';

const TestResult = ({ 
  result, 
  isError 
}: { 
  result: string | null, 
  isError: boolean 
}) => {
  if (!result) return null;
  
  return (
    <Alert 
      variant={isError ? "destructive" : "default"}
      className="mt-3 animate-in fade-in"
    >
      <div className="flex items-start gap-2">
        {isError ? (
          <XCircle className="h-5 w-5 text-destructive shrink-0 mt-0.5" />
        ) : (
          <CheckCircle2 className="h-5 w-5 text-green-500 shrink-0 mt-0.5" />
        )}
        <AlertDescription className="font-mono text-xs whitespace-pre-wrap">
          {result}
        </AlertDescription>
      </div>
    </Alert>
  );
};

const StatusBadge = ({ 
  isActive,
  connecting,
  label
}: { 
  isActive: boolean, 
  connecting: boolean,
  label: string 
}) => (
  <div className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
    connecting 
      ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300' 
      : isActive 
        ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300'
        : 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300'
  }`}>
    <div className={`w-2 h-2 mr-1.5 rounded-full ${
      connecting 
        ? 'bg-yellow-400 animate-pulse' 
        : isActive 
          ? 'bg-green-400 animate-pulse'
          : 'bg-gray-400'
    }`} />
    {label}
  </div>
);

const ConnectionInstructions = () => (
  <div className="p-4 bg-blue-50 dark:bg-blue-900/10 border border-blue-100 dark:border-blue-800 rounded-lg mt-6 text-sm">
    <div className="flex items-start gap-2">
      <Info className="h-5 w-5 text-blue-500 shrink-0 mt-0.5" />
      <div>
        <h4 className="font-medium text-blue-800 dark:text-blue-300 mb-1">Connection Steps</h4>
        <ol className="list-decimal list-inside text-blue-700 dark:text-blue-400 space-y-1 ml-0.5">
          <li>Test the HTTP endpoint first to verify the function is accessible</li>
          <li>If HTTP test passes, proceed to test the WebSocket connection</li>
          <li>Check the browser console for additional connection details</li>
          <li>Remember to disconnect WebSocket when testing is complete</li>
        </ol>
      </div>
    </div>
  </div>
);

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
  
  const [showInstructions, setShowInstructions] = useState(true);

  const isHttpError = httpResult ? httpResult.toLowerCase().includes('error') : false;
  const isWsError = wsResult ? wsResult.toLowerCase().includes('error') : false;

  return (
    <Card className="w-full shadow-md">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Globe className="h-5 w-5" /> Realtime API Connection Test
            </CardTitle>
            <CardDescription className="mt-1">
              Verify connectivity to your Supabase Edge Function and WebSocket endpoints
            </CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <StatusBadge 
              isActive={httpResult !== null && !isHttpError} 
              connecting={isTestingHttp}
              label="HTTP" 
            />
            <StatusBadge 
              isActive={hasActiveWsConnection} 
              connecting={isTestingWs}
              label="WebSocket" 
            />
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-6">
        {showInstructions && <ConnectionInstructions />}

        {/* HTTP Test Section */}
        <div className="space-y-2 pt-2">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-medium flex items-center gap-1.5">
              <CheckCircle2 size={16} className={httpResult && !isHttpError ? "text-green-500" : "text-gray-400"} />
              HTTP Endpoint Test
            </h3>
            <Button
              variant={httpResult && !isHttpError ? "outline" : "default"}
              size="sm"
              onClick={testHttpEndpoint}
              disabled={isTestingHttp}
              className="gap-1"
            >
              {isTestingHttp ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  Testing...
                </>
              ) : (
                'Test HTTP Endpoint'
              )}
            </Button>
          </div>
          
          {httpResult && (
            <TestResult result={httpResult} isError={isHttpError} />
          )}
        </div>
        
        <Separator />
        
        {/* WebSocket Test Section */}
        <div className="space-y-2 pt-2">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-medium flex items-center gap-1.5">
              <Radio size={16} className={hasActiveWsConnection ? "text-green-500 animate-pulse" : "text-gray-400"} />
              WebSocket Connection Test
            </h3>
            <div className="flex gap-2">
              <Button
                variant={wsResult && !isWsError && !hasActiveWsConnection ? "outline" : "default"}
                size="sm"
                onClick={testWsEndpoint}
                disabled={isTestingWs || hasActiveWsConnection}
                className="gap-1"
              >
                {isTestingWs ? (
                  <>
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
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
                  className="gap-1"
                >
                  <XCircle size={16} />
                  Disconnect
                </Button>
              )}
            </div>
          </div>
          
          {wsResult && (
            <TestResult result={wsResult} isError={isWsError} />
          )}
          
          {hasActiveWsConnection && (
            <div className="p-3 bg-green-50 dark:bg-green-900/20 rounded border border-green-200 dark:border-green-900 flex items-center gap-2 mt-3 animate-in fade-in">
              <CheckCircle2 className="text-green-500 h-5 w-5 shrink-0" />
              <div className="text-sm text-green-700 dark:text-green-300">
                <p className="font-medium">WebSocket connection attempt in progress.</p>
                <p className="text-xs mt-0.5 text-green-600 dark:text-green-400">Check browser console for detailed status information.</p>
              </div>
            </div>
          )}
        </div>
      </CardContent>
      
      <CardFooter className="border-t pt-4 flex items-center justify-between">
        <p className="text-xs text-gray-500">
          Connection issues? Check CORS settings and verify your Supabase plan supports WebSockets.
        </p>
        <Button 
          variant="ghost" 
          size="sm" 
          onClick={() => setShowInstructions(!showInstructions)}
          className="text-xs"
        >
          {showInstructions ? 'Hide' : 'Show'} Instructions
        </Button>
      </CardFooter>
    </Card>
  );
};

export default EndpointTester;
