
import React from "react";

const KeyboardShortcutsHelp: React.FC = () => {
  return (
    <div className="text-xs text-gray-500 text-center mt-1">
      Press <span className="px-1 py-0.5 bg-gray-200 rounded">Space</span> or{" "}
      <span className="px-1 py-0.5 bg-gray-200 rounded">Esc</span> to stop recording
    </div>
  );
};

export default KeyboardShortcutsHelp;
