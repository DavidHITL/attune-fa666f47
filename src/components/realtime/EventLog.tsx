
import React, { useRef, useEffect } from 'react';

interface EventLogProps {
  logs: string[];
}

const EventLog: React.FC<EventLogProps> = ({ logs }) => {
  const logRef = useRef<HTMLDivElement>(null);
  
  // Auto-scroll to bottom when logs update
  useEffect(() => {
    if (logRef.current) {
      logRef.current.scrollTop = logRef.current.scrollHeight;
    }
  }, [logs]);
  
  return (
    <div className="border rounded-md overflow-hidden">
      <div className="bg-slate-100 dark:bg-slate-800 px-3 py-1.5 text-sm font-medium">
        Event Log
      </div>
      <div 
        ref={logRef}
        className="h-32 overflow-y-auto p-2 text-xs font-mono bg-slate-50 dark:bg-slate-900"
      >
        {logs.length === 0 ? (
          <div className="text-slate-500 dark:text-slate-400 p-2">No events recorded</div>
        ) : (
          logs.map((log, index) => (
            <div key={index} className="py-0.5">
              {log}
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default EventLog;
