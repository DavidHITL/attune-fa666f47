
import React from "react";
import { MessageCircle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const ChatSessionsCard: React.FC = () => {
  // Dummy chat sessions count
  const sessionsLeft = 3;

  return (
    <Card className="border border-apple-gray-5 rounded-lg shadow-sm">
      <CardHeader className="flex flex-row items-center gap-2">
        <MessageCircle className="h-5 w-5 text-apple-blue" />
        <CardTitle className="text-xl">Chat Sessions</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-2xl font-bold">{sessionsLeft} left this week</p>
        <p className="text-muted-foreground text-sm">Your sessions reset every Monday</p>
      </CardContent>
    </Card>
  );
};

export default ChatSessionsCard;
