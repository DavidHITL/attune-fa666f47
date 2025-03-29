
import React from "react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { DatabaseIcon, AlertTriangleIcon, RefreshCwIcon } from "lucide-react";
import { Button } from "@/components/ui/button";

interface DatabaseConnectionAlertProps {
  onRetryConnection: () => void;
}

const DatabaseConnectionAlert: React.FC<DatabaseConnectionAlertProps> = ({ onRetryConnection }) => {
  return (
    <Alert variant="destructive" className="m-4">
      <DatabaseIcon className="h-4 w-4 mr-2" />
      <div className="flex-1">
        <AlertTitle>Database Connection Issue</AlertTitle>
        <AlertDescription className="flex flex-col gap-2">
          <p>Unable to save messages to the database due to permissions. Your messages will be stored locally only for this session.</p>
          <div className="flex items-center gap-2 text-xs text-muted-foreground mt-1">
            <AlertTriangleIcon className="h-3 w-3" />
            <span>Note: These messages will be lost when you close your browser.</span>
          </div>
          <Button 
            variant="outline" 
            size="sm"
            className="mt-2 self-start flex items-center gap-2"
            onClick={onRetryConnection}
          >
            <RefreshCwIcon className="h-3 w-3" /> 
            Retry Database Connection
          </Button>
        </AlertDescription>
      </div>
    </Alert>
  );
};

export default DatabaseConnectionAlert;
