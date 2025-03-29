
import React from "react";
import { Link, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";

const NavBar: React.FC = () => {
  const location = useLocation();
  const currentPath = location.pathname;

  return (
    <nav className="w-full backdrop-blur-md bg-white/90 border-b border-apple-gray-5 sticky top-0 z-10">
      <div className="max-w-4xl mx-auto py-4 px-6 flex justify-between items-center">
        <div className="flex-1">
          <Link 
            to="/learn" 
            className={cn(
              "text-apple-gray hover:text-apple-gray-3 transition-colors",
              currentPath === "/learn" && "invisible"
            )}
          >
            Learn
          </Link>
          {currentPath === "/learn" && (
            <span className="text-xl font-medium">Learn</span>
          )}
        </div>
        
        <div className="text-center flex-1">
          <Link 
            to="/you" 
            className={cn(
              "text-apple-gray hover:text-apple-gray-3 transition-colors",
              currentPath === "/you" && "invisible"
            )}
          >
            You
          </Link>
          {currentPath === "/you" && (
            <span className="text-xl font-medium">You</span>
          )}
        </div>
        
        <div className="flex-1 text-right">
          <Link 
            to="/chat" 
            className={cn(
              "text-apple-gray hover:text-apple-gray-3 transition-colors",
              currentPath === "/chat" && "invisible"
            )}
          >
            Chat
          </Link>
          {currentPath === "/chat" && (
            <span className="text-xl font-medium text-right">Chat</span>
          )}
        </div>
      </div>
    </nav>
  );
};

export default NavBar;
