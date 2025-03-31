
import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Loader2, CheckCircle, XCircle, AlertTriangle } from 'lucide-react';
import { toast } from 'sonner';
import { getEphemeralKey } from "@/services/api/ephemeralKeyService";

interface DiagnosticResult {
  name: string;
  status: 'success' | 'warning' | 'error' | 'pending';
  message: string;
}

const WebRTCDiagnostics = () => {
  const [isRunning, setIsRunning] = useState(false);
  const [results, setResults] = useState<DiagnosticResult[]>([]);
  const [overallStatus, setOverallStatus] = useState<'success' | 'warning' | 'error' | 'pending'>('pending');
  
  // Add a diagnostic result
  const addResult = (result: DiagnosticResult) => {
    setResults(prev => [...prev, result]);
  };
  
  // Run diagnostic tests for WebRTC
  const runDiagnostics = async () => {
    try {
      setIsRunning(true);
      setResults([]);
      setOverallStatus('pending');
      
      // Test 1: Check WebRTC API availability
      try {
        const rtcPeerConnection = window.RTCPeerConnection;
        const rtcSessionDescription = window.RTCSessionDescription;
        const mediaDevices = navigator.mediaDevices;
        
        if (!rtcPeerConnection) {
          addResult({
            name: "RTCPeerConnection API",
            status: "error",
            message: "RTCPeerConnection not available. WebRTC is not supported in this browser."
          });
        } else if (!rtcSessionDescription) {
          addResult({
            name: "RTCSessionDescription API",
            status: "error",
            message: "RTCSessionDescription not available. WebRTC is not fully supported in this browser."
          });
        } else if (!mediaDevices) {
          addResult({
            name: "MediaDevices API",
            status: "error",
            message: "MediaDevices API not available. Cannot access media devices."
          });
        } else {
          addResult({
            name: "WebRTC APIs",
            status: "success",
            message: "All required WebRTC APIs are available."
          });
        }
      } catch (error) {
        addResult({
          name: "WebRTC APIs",
          status: "error",
          message: `Error checking WebRTC APIs: ${error instanceof Error ? error.message : String(error)}`
        });
      }
      
      // Test 2: Check HTTPS
      if (window.location.protocol !== 'https:' && window.location.hostname !== 'localhost') {
        addResult({
          name: "HTTPS",
          status: "error",
          message: "Not using HTTPS. WebRTC requires a secure context (HTTPS or localhost)."
        });
      } else {
        addResult({
          name: "HTTPS",
          status: "success",
          message: `Using secure context: ${window.location.protocol}`
        });
      }
      
      // Test 3: Test ephemeral key access
      try {
        addResult({
          name: "Ephemeral Key",
          status: "pending",
          message: "Testing ephemeral key service..."
        });
        
        const startTime = Date.now();
        const key = await getEphemeralKey();
        const duration = Date.now() - startTime;
        
        if (key) {
          // Don't show the key in logs - just show that we got one
          setResults(prev => prev.map(r => 
            r.name === "Ephemeral Key" ? {
              name: "Ephemeral Key",
              status: "success",
              message: `Successfully retrieved ephemeral key in ${duration}ms`
            } : r
          ));
        } else {
          setResults(prev => prev.map(r => 
            r.name === "Ephemeral Key" ? {
              name: "Ephemeral Key",
              status: "error",
              message: "Failed to retrieve ephemeral key (null response)"
            } : r
          ));
        }
      } catch (error) {
        setResults(prev => prev.map(r => 
          r.name === "Ephemeral Key" ? {
            name: "Ephemeral Key",
            status: "error",
            message: `Error getting ephemeral key: ${error instanceof Error ? error.message : String(error)}`
          } : r
        ));
      }
      
      // Test 4: Create a minimal peer connection
      try {
        addResult({
          name: "RTCPeerConnection Creation",
          status: "pending",
          message: "Testing peer connection creation..."
        });
        
        const pc = new RTCPeerConnection({
          iceServers: [{ urls: "stun:stun.l.google.com:19302" }]
        });
        
        // Create a data channel to test connectivity
        const dc = pc.createDataChannel("test");
        
        // Create an offer
        const offer = await pc.createOffer();
        await pc.setLocalDescription(offer);
        
        // Clean up
        dc.close();
        pc.close();
        
        setResults(prev => prev.map(r => 
          r.name === "RTCPeerConnection Creation" ? {
            name: "RTCPeerConnection Creation",
            status: "success",
            message: "Successfully created RTCPeerConnection and local offer"
          } : r
        ));
      } catch (error) {
        setResults(prev => prev.map(r => 
          r.name === "RTCPeerConnection Creation" ? {
            name: "RTCPeerConnection Creation",
            status: "error",
            message: `Error creating RTCPeerConnection: ${error instanceof Error ? error.message : String(error)}`
          } : r
        ));
      }
      
      // Test 5: Check for microphone access
      try {
        addResult({
          name: "Microphone Access",
          status: "pending",
          message: "Checking microphone permissions..."
        });
        
        const permissionStatus = await navigator.permissions.query({ name: 'microphone' as PermissionName });
        
        if (permissionStatus.state === 'granted') {
          setResults(prev => prev.map(r => 
            r.name === "Microphone Access" ? {
              name: "Microphone Access",
              status: "success",
              message: "Microphone permission granted"
            } : r
          ));
        } else if (permissionStatus.state === 'prompt') {
          setResults(prev => prev.map(r => 
            r.name === "Microphone Access" ? {
              name: "Microphone Access",
              status: "warning",
              message: "Microphone permission not yet granted (user will be prompted)"
            } : r
          ));
        } else {
          setResults(prev => prev.map(r => 
            r.name === "Microphone Access" ? {
              name: "Microphone Access",
              status: "error",
              message: "Microphone permission denied"
            } : r
          ));
        }
      } catch (error) {
        setResults(prev => prev.map(r => 
          r.name === "Microphone Access" ? {
            name: "Microphone Access",
            status: "error",
            message: `Error checking microphone permission: ${error instanceof Error ? error.message : String(error)}`
          } : r
        ));
      }
      
      // Calculate overall status
      setTimeout(() => {
        const hasError = results.some(r => r.status === 'error');
        const hasWarning = results.some(r => r.status === 'warning');
        
        if (hasError) {
          setOverallStatus('error');
        } else if (hasWarning) {
          setOverallStatus('warning');
        } else {
          setOverallStatus('success');
        }
        
        // Display overall result
        if (hasError) {
          toast.error("WebRTC diagnostic found issues that will prevent connection");
        } else if (hasWarning) {
          toast.warning("WebRTC diagnostic found potential issues");
        } else {
          toast.success("WebRTC environment looks good!");
        }
        
        setIsRunning(false);
      }, 500);
      
    } catch (error) {
      console.error("Error running WebRTC diagnostics:", error);
      toast.error(`Diagnostic error: ${error instanceof Error ? error.message : String(error)}`);
      setIsRunning(false);
      setOverallStatus('error');
    }
  };
  
  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>WebRTC Environment Diagnostics</CardTitle>
        <CardDescription>
          Test your browser and network environment for WebRTC compatibility
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Overall Status */}
        {overallStatus !== 'pending' && results.length > 0 && (
          <Alert className={`mb-4 ${overallStatus === 'success' ? 'bg-green-50 border-green-200' : overallStatus === 'warning' ? 'bg-yellow-50 border-yellow-200' : 'bg-red-50 border-red-200'}`}>
            {overallStatus === 'success' ? (
              <CheckCircle className="h-4 w-4 text-green-500" />
            ) : overallStatus === 'warning' ? (
              <AlertTriangle className="h-4 w-4 text-yellow-500" />
            ) : (
              <XCircle className="h-4 w-4 text-red-500" />
            )}
            <AlertTitle className={`${overallStatus === 'success' ? 'text-green-700' : overallStatus === 'warning' ? 'text-yellow-700' : 'text-red-700'}`}>
              {overallStatus === 'success' ? 'Environment Compatible' : overallStatus === 'warning' ? 'Potential Issues' : 'Compatibility Issues'}
            </AlertTitle>
            <AlertDescription className={`${overallStatus === 'success' ? 'text-green-600' : overallStatus === 'warning' ? 'text-yellow-600' : 'text-red-600'}`}>
              {overallStatus === 'success' ? 'Your environment appears compatible with WebRTC.' : 
                overallStatus === 'warning' ? 'Some issues may affect WebRTC functionality.' :
                'Critical issues found that will prevent WebRTC connections.'}
            </AlertDescription>
          </Alert>
        )}
        
        {/* Test Results */}
        <div className="space-y-2">
          {results.map((result, index) => (
            <div key={index} className="flex items-center justify-between p-3 border rounded-md">
              <div className="flex items-center gap-2">
                {result.status === 'success' ? (
                  <CheckCircle className="h-4 w-4 text-green-500" />
                ) : result.status === 'warning' ? (
                  <AlertTriangle className="h-4 w-4 text-yellow-500" />
                ) : result.status === 'error' ? (
                  <XCircle className="h-4 w-4 text-red-500" />
                ) : (
                  <Loader2 className="h-4 w-4 animate-spin text-blue-500" />
                )}
                <span className="font-medium">{result.name}</span>
              </div>
              <Badge 
                variant={result.status === 'success' ? 'default' : 
                  result.status === 'warning' ? 'outline' : 
                  result.status === 'error' ? 'destructive' : 
                  'secondary'}
              >
                {result.status === 'pending' ? 'Testing...' : 
                 result.status === 'success' ? 'Passed' :
                 result.status === 'warning' ? 'Warning' : 'Failed'}
              </Badge>
              <div className="text-sm text-gray-500 ml-2 flex-1 text-right">{result.message}</div>
            </div>
          ))}
        </div>
      </CardContent>
      <CardFooter>
        <Button
          onClick={runDiagnostics}
          disabled={isRunning}
          className="w-full"
        >
          {isRunning ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Running Diagnostics...
            </>
          ) : (
            'Run WebRTC Diagnostics'
          )}
        </Button>
      </CardFooter>
    </Card>
  );
};

export default WebRTCDiagnostics;
