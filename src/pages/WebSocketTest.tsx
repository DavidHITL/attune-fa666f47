
import React from 'react';
import NavBar from '@/components/NavBar';
import DirectConnectionTester from '@/components/realtime/DirectConnectionTester';

const WebSocketTest: React.FC = () => {
  return (
    <div className="min-h-screen flex flex-col">
      <NavBar />
      <div className="container mx-auto p-4 flex-1">
        <h1 className="text-2xl font-bold mb-6">OpenAI Realtime API Connection Test</h1>
        <p className="mb-4 text-gray-700">
          Test direct connection to OpenAI's Realtime API using the secure WebRTC protocol.
          This functionality powers the voice conversation feature.
        </p>
        <DirectConnectionTester />
      </div>
    </div>
  );
};

export default WebSocketTest;
