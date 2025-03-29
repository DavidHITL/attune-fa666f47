
import React from "react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

interface KeepInMindCardProps {
  isAuthenticated: boolean;
}

const KeepInMindCard: React.FC<KeepInMindCardProps> = ({ isAuthenticated }) => {
  return (
    <Card className="border border-apple-gray-5 rounded-lg shadow-sm">
      <CardHeader>
        <CardTitle className="text-xl">Keep in Mind</CardTitle>
        <CardDescription>Key insights from your conversations</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {isAuthenticated ? (
            <>
              <div className="space-y-2">
                <h3 className="font-medium">Topic 1: Communication Style</h3>
                <p className="text-muted-foreground text-sm">You tend to withdraw during conflicts. Consider expressing your needs more directly.</p>
              </div>
              <Separator />
              <div className="space-y-2">
                <h3 className="font-medium">Topic 2: Listening Skills</h3>
                <p className="text-muted-foreground text-sm">You excel at active listening but sometimes interrupt to express your perspective.</p>
              </div>
            </>
          ) : (
            <p className="text-muted-foreground italic">We need to talk before we can be sure about your most important challenges.</p>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default KeepInMindCard;
