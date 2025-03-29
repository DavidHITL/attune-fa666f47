
import React from "react";
import { useAuth } from "@/context/AuthContext";

const AvailableSessions: React.FC = () => {
  // In a real implementation, this would fetch from the database
  // For now, we'll use a static value that could later be replaced with actual user data
  const { user } = useAuth();
  const sessionsLeft = 3; // This would be fetched from the database in a real implementation

  return (
    <div className="text-center">
      <div className="text-lg font-medium">{sessionsLeft} sessions available this week</div>
      <div className="text-sm text-muted-foreground">Sessions reset every Monday</div>
    </div>
  );
};

export default AvailableSessions;
