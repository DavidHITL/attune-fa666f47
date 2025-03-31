
import React from 'react';
import { Container } from '@/components/ui/Container';
import { PageHeader } from '@/components/ui/PageHeader';
import EndpointTester from '@/components/realtime/EndpointTester';
import WebSocketTester from '@/components/realtime/WebSocketTester';
import DirectConnectionTester from '@/components/realtime/DirectConnectionTester';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const TestApi: React.FC = () => {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
      <Container>
        <PageHeader
          title="API Connection Test"
          description="Verify that the Supabase Edge Functions are accessible and WebSocket connections are working"
        />
        
        <div className="mt-8">
          <Tabs defaultValue="direct-connection">
            <TabsList className="grid w-full grid-cols-3 mb-4">
              <TabsTrigger value="endpoint-test">Full Endpoint Tests</TabsTrigger>
              <TabsTrigger value="minimal-test">Minimal WS Test</TabsTrigger>
              <TabsTrigger value="direct-connection">Direct OpenAI Connection</TabsTrigger>
            </TabsList>
            
            <TabsContent value="endpoint-test">
              <EndpointTester />
            </TabsContent>
            
            <TabsContent value="minimal-test">
              <div className="grid gap-6">
                <WebSocketTester />
                
                <div className="p-4 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-900 rounded-md">
                  <h3 className="font-medium text-amber-800 dark:text-amber-300">Debugging Tips</h3>
                  <ul className="mt-2 list-disc list-inside text-sm text-amber-700 dark:text-amber-400 space-y-1">
                    <li>This test uses a minimal WebSocket echo server with extensive logging</li>
                    <li>Check the Edge Function logs for detailed information about the connection process</li>
                    <li>The 101 Switching Protocols response must be returned immediately</li>
                    <li>Any post-handshake initialization must happen asynchronously after the response is returned</li>
                  </ul>
                </div>
              </div>
            </TabsContent>
            
            <TabsContent value="direct-connection">
              <div className="grid gap-6">
                <DirectConnectionTester />
                
                <div className="p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-900 rounded-md">
                  <h3 className="font-medium text-blue-800 dark:text-blue-300">Direct Connection Info</h3>
                  <ul className="mt-2 list-disc list-inside text-sm text-blue-700 dark:text-blue-400 space-y-1">
                    <li>This approach uses a Supabase Edge Function to generate ephemeral tokens</li>
                    <li>The browser then connects directly to OpenAI's Realtime API using WebRTC</li>
                    <li>This bypasses WebSocket handshake issues that can occur with Edge Function relaying</li>
                    <li>Audio is processed at 24kHz in 16-bit PCM format as required by OpenAI</li>
                  </ul>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </Container>
    </div>
  );
};

export default TestApi;
