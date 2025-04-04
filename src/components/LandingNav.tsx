
import React from "react";
import { Button } from "@/components/ui/button";

interface LandingNavProps {
  onScrollToSection: (sectionId: string) => void;
}

const LandingNav = ({ onScrollToSection }: LandingNavProps) => {
  return (
    <nav className="fixed top-0 left-0 w-full bg-white/95 backdrop-blur-sm z-50 border-b border-gray-100 py-4">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex justify-between items-center">
        <div className="flex-shrink-0">
          {/* Logo placeholder */}
          <div className="h-10 w-32 bg-gray-100 rounded flex items-center justify-center text-gray-400">
            Logo
          </div>
        </div>
        
        <div className="flex items-center space-x-6">
          <Button 
            variant="link" 
            className="text-gray-800 hover:text-gray-600 text-lg font-medium"
            onClick={() => onScrollToSection('why-section')}
          >
            Why
          </Button>
          <Button 
            variant="link" 
            className="text-gray-800 hover:text-gray-600 text-lg font-medium"
            onClick={() => onScrollToSection('how-section')}
          >
            How
          </Button>
        </div>
      </div>
    </nav>
  );
};

export default LandingNav;
