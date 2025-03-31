
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import VoiceChat from '@/components/realtime/VoiceChat';
import ConnectionTest from './ConnectionTest';
import WebRTCDiagnostics from './WebRTCDiagnostics';

interface RealtimeChatProps {
  sessionStarted?: boolean;
  sessionEndTime?: number | null;
}

const RealtimeChat: React.FC<RealtimeChatProps> = ({
  sessionStarted = false,
  sessionEndTime = null
}) => {
  const [activeTab, setActiveTab] = useState<string>("voice-chat");

  return (
    <div className="fixed bottom-20 right-4 z-50 w-96 md:w-[460px]">
      <Card className="shadow-lg border-gray-200 bg-white">
        <CardHeader className="py-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg">Voice Chat</CardTitle>
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList>
                <TabsTrigger value="voice-chat">Chat</TabsTrigger>
                <TabsTrigger value="tests">Tests</TabsTrigger>
                <TabsTrigger value="diagnostics">Diagnostics</TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
        </CardHeader>
        <CardContent className="p-4">
          <TabsContent value="voice-chat">
            <VoiceChat 
              systemPrompt="You are a helpful AI assistant. Be concise in your responses."
              voice="alloy"
            />
          </TabsContent>
          <TabsContent value="tests">
            <ConnectionTest />
          </TabsContent>
          <TabsContent value="diagnostics">
            <WebRTCDiagnostics />
          </TabsContent>
        </CardContent>
      </Card>
    </div>
  );
};

export default RealtimeChat;
