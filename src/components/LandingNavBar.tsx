
import React from "react";
import { Link, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";

const LandingNavBar: React.FC = () => {
  const location = useLocation();
  const currentPath = location.pathname;

  return (
    <nav className="w-full backdrop-blur-md bg-white/90 border-b border-apple-gray-5 sticky top-0 z-10">
      <div className="max-w-4xl mx-auto py-4 px-6 flex justify-between items-center">
        <div className="flex-1">
          <Link to="/" className="text-apple-gray hover:text-apple-gray-3 transition-colors">
            About
          </Link>
        </div>
        
        <div className="text-center flex-1">
          <span className="text-xl font-medium">Attune</span>
        </div>
        
        <div className="flex-1 text-right">
          <Link to="/" className="text-apple-gray hover:text-apple-gray-3 transition-colors">
            Methodology
          </Link>
        </div>
      </div>
    </nav>
  );
};

export default LandingNavBar;
