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
  return <div className="fixed bottom-20 right-4 z-50 w-96 md:w-[460px]">
      <Card className="shadow-lg border-gray-200 bg-white">
        
        
      </Card>
    </div>;
};
export default RealtimeChat;