
import React from 'react';
import { Container } from '@/components/ui/Container';
import { PageHeader } from '@/components/ui/PageHeader';
import DirectConnectionTester from '@/components/realtime/DirectConnectionTester';

const TestApi: React.FC = () => {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
      <Container>
        <PageHeader
          title="OpenAI Realtime API Connection Test"
          description="Test direct connection to the OpenAI Realtime API using WebRTC"
        />
        
        <div className="mt-8">
          <DirectConnectionTester />
          
          <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-900 rounded-md">
            <h3 className="font-medium text-blue-800 dark:text-blue-300">Direct Connection Info</h3>
            <ul className="mt-2 list-disc list-inside text-sm text-blue-700 dark:text-blue-400 space-y-1">
              <li>This approach connects directly to OpenAI's Realtime API using WebRTC</li>
              <li>A Supabase Edge Function generates ephemeral tokens needed for authentication</li>
              <li>Audio is processed at 24kHz in 16-bit PCM format as required by OpenAI</li>
              <li>Both text and voice inputs are supported in a seamless conversation</li>
            </ul>
          </div>
        </div>
      </Container>
    </div>
  );
};

export default TestApi;
