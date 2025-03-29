
import React from "react";

const ChatLoadingState: React.FC = () => {
  return (
    <div className="flex flex-col h-full items-center justify-center">
      <div className="text-center p-4">
        <div className="spinner mb-4">Loading...</div>
        <p>Checking authentication...</p>
      </div>
    </div>
  );
};

export default ChatLoadingState;
