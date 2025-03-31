
import React, { useEffect, useRef } from 'react';

interface EventLogProps {
  logs: string[];
}

const EventLog: React.FC<EventLogProps> = ({ logs }) => {
  const logRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Auto-scroll to bottom when new logs are added
    if (logRef.current) {
      logRef.current.scrollTop = logRef.current.scrollHeight;
    }
  }, [logs]);

  return (
    <div className="border rounded-md overflow-hidden">
      <div className="bg-gray-100 dark:bg-gray-800 px-3 py-1.5 text-sm font-medium border-b">
        Event Log
      </div>
      <div 
        ref={logRef} 
        className="bg-gray-50 dark:bg-gray-900 text-xs font-mono p-3 overflow-y-auto max-h-[150px]"
      >
        {logs.length > 0 ? (
          logs.map((log, index) => (
            <div key={index} className="whitespace-pre-wrap mb-1">
              {log}
            </div>
          ))
        ) : (
          <div className="text-gray-400">No events logged</div>
        )}
      </div>
    </div>
  );
};

export default EventLog;
