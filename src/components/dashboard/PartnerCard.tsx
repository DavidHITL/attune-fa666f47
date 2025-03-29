
import React from "react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

const PartnerCard: React.FC = () => {
  return (
    <Card className="border border-apple-gray-5 rounded-lg shadow-sm">
      <CardHeader>
        <CardTitle className="text-xl">Partner</CardTitle>
        <CardDescription>Connect with your partner</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <span className="font-medium">Partner Linked:</span>
            <span className="text-muted-foreground">No</span>
          </div>
          <div className="flex flex-col sm:flex-row gap-3">
            <Button className="bg-apple-blue hover:bg-opacity-90" size="lg">Generate Code</Button>
            <Button variant="outline" size="lg">Send to Partner</Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default PartnerCard;
