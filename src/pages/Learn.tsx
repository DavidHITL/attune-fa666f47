
import React from "react";
import NavBar from "@/components/NavBar";

const Learn: React.FC = () => {
  return (
    <div className="flex flex-col min-h-screen">
      <NavBar />
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-semibold mb-4">Learn Page</h1>
          <p className="text-gray-600">
            This is the Learn section where educational content would appear.
          </p>
        </div>
      </div>
      <footer className="text-center py-3 text-xs text-gray-500 border-t border-gray-200">
        Attune<br />
        Napkin LLC — Zurich
      </footer>
    </div>
  );
};

export default Learn;
