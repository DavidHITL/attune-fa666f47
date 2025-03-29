
import React from "react";

interface SummarySectionProps {
  summaryText: string;
}

const SummarySection: React.FC<SummarySectionProps> = ({ summaryText }) => {
  return (
    <div className="mt-2 p-3 bg-slate-50 rounded-md">
      <p className="text-sm font-medium">Summary:</p>
      <p className="text-sm">{summaryText}</p>
    </div>
  );
};

export default SummarySection;
