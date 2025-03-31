
import React from "react";
import { Progress } from "@/components/ui/progress";

interface TranscriptDisplayProps {
  isConnected: boolean;
  isAiSpeaking: boolean;
  isProcessingAudio: boolean;
  currentTranscript: string;
  transcriptProgress?: number;
}

const TranscriptDisplay: React.FC<TranscriptDisplayProps> = ({
  isConnected,
  isAiSpeaking,
  isProcessingAudio,
  currentTranscript,
  transcriptProgress,
}) => {
  if (!isConnected) return null;
  
  return (
    <div className={`relative p-4 rounded-lg border ${
      isAiSpeaking || isProcessingAudio ? "border-green-500 bg-green-50" : "border-gray-200"
    }`}>
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-sm font-medium">AI Response</h3>
        {(isAiSpeaking || isProcessingAudio) && (
          <div className="flex space-x-1">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-bounce" style={{ animationDelay: "0ms" }}></div>
            <div className="w-2 h-2 bg-green-500 rounded-full animate-bounce" style={{ animationDelay: "300ms" }}></div>
            <div className="w-2 h-2 bg-green-500 rounded-full animate-bounce" style={{ animationDelay: "600ms" }}></div>
          </div>
        )}
      </div>
      <div className="text-gray-700 min-h-24 max-h-48 overflow-y-auto">
        {currentTranscript || (isConnected && !isAiSpeaking && "Say something or type a message below...")}
      </div>
      
      {/* Transcript Progress Indicator */}
      {(isAiSpeaking || isProcessingAudio) && transcriptProgress !== undefined && (
        <div className="mt-2">
          <Progress value={transcriptProgress} className="h-1" />
        </div>
      )}
    </div>
  );
};

export default TranscriptDisplay;
