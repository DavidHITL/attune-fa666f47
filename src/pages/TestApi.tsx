
import React from 'react';
import { Container } from '@/components/ui/Container';
import { PageHeader } from '@/components/ui/PageHeader';
import EndpointTester from '@/components/realtime/EndpointTester';
import WebSocketTester from '@/components/realtime/WebSocketTester';
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
          <Tabs defaultValue="endpoint-test">
            <TabsList className="grid w-full grid-cols-2 mb-4">
              <TabsTrigger value="endpoint-test">Full Endpoint Tests</TabsTrigger>
              <TabsTrigger value="minimal-test">Minimal WS Test</TabsTrigger>
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
          </Tabs>
        </div>
      </Container>
    </div>
  );
};

export default TestApi;
