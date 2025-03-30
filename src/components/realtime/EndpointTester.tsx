
import React from 'react';
import { useEndpointTest } from '@/hooks/useEndpointTest';
import { Button } from "@/components/ui/button";
import { CheckCircle, XCircle, Loader2 } from "lucide-react";
import ConnectionTest from './ConnectionTest';

const EndpointTester: React.FC = () => {
  const { 
    httpStatus, 
    wsStatus, 
    httpMessage, 
    wsMessage, 
    isLoading, 
    testHttpEndpoint, 
    testWsConnection, 
    closeWsConnection 
  } = useEndpointTest();

  return (
    <div className="space-y-8">
      <div className="grid gap-6 md:grid-cols-2">
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-medium mb-4 flex items-center">
            HTTP Endpoint Test
            {httpStatus === 'success' && <CheckCircle className="ml-2 h-5 w-5 text-green-500" />}
            {httpStatus === 'error' && <XCircle className="ml-2 h-5 w-5 text-red-500" />}
          </h3>
          
          <div className="mb-4">
            <p className="text-sm text-gray-600 dark:text-gray-300 mb-2">
              Tests if the Edge Function is accessible via HTTP.
            </p>
            {httpMessage && (
              <div className="mt-2 p-3 bg-gray-50 dark:bg-gray-900 rounded-md text-sm font-mono whitespace-pre-wrap max-h-40 overflow-auto">
                {httpMessage}
              </div>
            )}
          </div>
          
          <Button 
            onClick={testHttpEndpoint} 
            disabled={isLoading.http}
            variant="outline" 
            className="w-full"
          >
            {isLoading.http ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Testing...
              </>
            ) : 'Test HTTP Endpoint'}
          </Button>
        </div>
        
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-medium mb-4 flex items-center">
            WebSocket Connection Test
            {wsStatus === 'success' && <CheckCircle className="ml-2 h-5 w-5 text-green-500" />}
            {wsStatus === 'error' && <XCircle className="ml-2 h-5 w-5 text-red-500" />}
          </h3>
          
          <div className="mb-4">
            <p className="text-sm text-gray-600 dark:text-gray-300 mb-2">
              Tests if WebSocket connections can be established with the Edge Function.
            </p>
            {wsMessage && (
              <div className="mt-2 p-3 bg-gray-50 dark:bg-gray-900 rounded-md text-sm font-mono whitespace-pre-wrap max-h-40 overflow-auto">
                {wsMessage}
              </div>
            )}
          </div>
          
          <div className="flex gap-2">
            <Button 
              onClick={testWsConnection} 
              disabled={isLoading.ws}
              variant="outline" 
              className="flex-1"
            >
              {isLoading.ws ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Connecting...
                </>
              ) : 'Test WebSocket'}
            </Button>
            <Button 
              onClick={closeWsConnection}
              disabled={!isLoading.ws} 
              variant="destructive"
            >
              Close
            </Button>
          </div>
        </div>
      </div>
      
      <div className="mt-8">
        <ConnectionTest />
      </div>
    </div>
  );
};

export default EndpointTester;
