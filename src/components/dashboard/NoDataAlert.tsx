
import React from "react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Info } from "lucide-react";

const NoDataAlert: React.FC = () => {
  return (
    <Alert className="bg-slate-50 border border-slate-200">
      <Info className="h-4 w-4 text-slate-500" />
      <AlertDescription>
        Complete more chat sessions to receive personalized insights about your communication patterns.
      </AlertDescription>
    </Alert>
  );
};

export default NoDataAlert;
