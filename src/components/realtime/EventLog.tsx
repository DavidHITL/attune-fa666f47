
import React from 'react';

interface EventLogProps {
  logs: string[];
}

const EventLog: React.FC<EventLogProps> = ({ logs }) => {
  return (
    <div className="mt-4">
      <h3 className="text-sm font-medium mb-2">Event Log</h3>
      <div className="p-3 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-md h-48 overflow-auto">
        {logs.length === 0 ? (
          <div className="text-gray-400 italic">No events yet</div>
        ) : (
          <pre className="text-xs whitespace-pre-wrap font-mono">
            {logs.join('\n')}
          </pre>
        )}
      </div>
    </div>
  );
};

export default EventLog;
