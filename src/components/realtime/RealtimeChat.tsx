
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
        <CardHeader className="pb-2">
          <CardTitle className="text-lg flex justify-between items-center">
            <span>Voice Chat</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid grid-cols-3 w-full">
              <TabsTrigger value="voice-chat">Voice</TabsTrigger>
              <TabsTrigger value="connection">Connection</TabsTrigger>
              <TabsTrigger value="diagnostics">Diagnostics</TabsTrigger>
            </TabsList>
            <TabsContent value="voice-chat" className="mt-2">
              <VoiceChat />
            </TabsContent>
            <TabsContent value="connection" className="mt-2">
              <ConnectionTest />
            </TabsContent>
            <TabsContent value="diagnostics" className="mt-2">
              <WebRTCDiagnostics />
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};

export default RealtimeChat;
