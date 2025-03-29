
import React from "react";
import { Link } from "react-router-dom";

const LandingNavBar: React.FC = () => {
  return (
    <nav className="w-full border-b border-gray-200">
      <div className="max-w-4xl mx-auto py-4 px-4 flex justify-between items-center">
        <div className="flex-1">
          <Link to="/" className="text-gray-800 hover:text-gray-600">
            About
          </Link>
        </div>
        
        <div className="text-center flex-1">
          <Link to="/" className="text-xl font-medium">
            Attune
          </Link>
        </div>
        
        <div className="flex-1 text-right">
          <Link to="/" className="text-gray-800 hover:text-gray-600">
            Methodology
          </Link>
        </div>
      </div>
    </nav>
  );
};

export default LandingNavBar;
