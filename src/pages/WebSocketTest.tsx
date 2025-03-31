
import React from 'react';
import NavBar from '@/components/NavBar';
import WebSocketTester from '@/components/realtime/WebSocketTester';

const WebSocketTest: React.FC = () => {
  return (
    <div className="min-h-screen flex flex-col">
      <NavBar />
      <div className="container mx-auto p-4 flex-1">
        <h1 className="text-2xl font-bold mb-6">WebSocket Connection Tester</h1>
        <p className="mb-4 text-gray-700">
          Use this tool to test the WebSocket connection to the Supabase Edge Function.
          This can help diagnose issues with the realtime chat functionality.
        </p>
        <WebSocketTester />
      </div>
    </div>
  );
};

export default WebSocketTest;
