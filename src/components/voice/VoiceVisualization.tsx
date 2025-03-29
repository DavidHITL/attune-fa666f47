
import React from 'react';
import { cn } from "@/lib/utils";

interface VoiceVisualizationProps {
  isActive: boolean;
  className?: string;
}

const VoiceVisualization: React.FC<VoiceVisualizationProps> = ({ isActive, className }) => {
  return (
    <div className={cn("relative flex items-center justify-center", className)}>
      <div className="w-48 h-48 rounded-full overflow-hidden bg-gradient-to-b from-blue-300 to-blue-500">
        {/* Inner circle with subtle animation */}
        <div 
          className={cn(
            "absolute inset-0 bg-gradient-to-b from-white/60 to-blue-400/60 rounded-full",
            isActive && "animate-pulse"
          )}
          style={{
            backgroundSize: '400% 400%',
            animation: isActive ? 'gradient 3s ease infinite, pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite' : 'none',
          }}
        />
        
        {/* Wave effect when active */}
        {isActive && (
          <>
            <div className="absolute inset-0 opacity-70 rounded-full"
              style={{
                background: 'radial-gradient(circle, rgba(255,255,255,0.8) 0%, rgba(255,255,255,0) 70%)',
                animation: 'ripple 2s linear infinite',
              }}
            />
            <div className="absolute inset-0 opacity-50 rounded-full"
              style={{
                background: 'radial-gradient(circle, rgba(255,255,255,0.8) 0%, rgba(255,255,255,0) 70%)',
                animation: 'ripple 2s linear 1s infinite',
              }}
            />
          </>
        )}
      </div>

      {/* Add keyframes for animations */}
      <style jsx>{`
        @keyframes ripple {
          0% {
            transform: scale(0.8);
            opacity: 0.7;
          }
          100% {
            transform: scale(1.4);
            opacity: 0;
          }
        }
        
        @keyframes gradient {
          0% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }
      `}</style>
    </div>
  );
};

export default VoiceVisualization;
