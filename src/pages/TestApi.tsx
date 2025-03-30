
import React from 'react';
import { Container } from '@/components/ui/Container';
import { PageHeader } from '@/components/ui/PageHeader';
import EndpointTester from '@/components/realtime/EndpointTester';

const TestApi: React.FC = () => {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
      <Container>
        <PageHeader
          heading="API Connection Test"
          text="Verify that the Supabase Edge Functions are accessible and WebSocket connections are working"
        />
        
        <div className="mt-8">
          <EndpointTester />
        </div>
        
        <div className="mt-8 p-4 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-900 rounded-md">
          <h3 className="font-medium text-amber-800 dark:text-amber-300">Troubleshooting Tips</h3>
          <ul className="mt-2 list-disc list-inside text-sm text-amber-700 dark:text-amber-400 space-y-1">
            <li>If HTTP works but WebSocket fails, check the WebSocket upgrade in the edge function</li>
            <li>Verify that JWT verification is disabled in the function's config.toml</li>
            <li>Check browser console for CORS or other connection errors</li>
            <li>Ensure your Supabase project is on a plan that supports WebSockets</li>
          </ul>
        </div>
      </Container>
    </div>
  );
};

export default TestApi;
