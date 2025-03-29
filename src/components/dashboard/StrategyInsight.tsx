
import React from "react";
import { strategyNames, behavioralIndicators, healthyAlternatives } from "@/utils/strategyUtils";

interface StrategyInsightProps {
  strategy: keyof typeof strategyNames;
  index: number;
}

const StrategyInsight: React.FC<StrategyInsightProps> = ({ strategy, index }) => {
  return (
    <div className="p-4 bg-slate-50 rounded-md">
      <h3 className="font-medium text-base">
        Losing Strategy {index + 1}: {strategyNames[strategy]}
      </h3>
      <p className="text-sm text-slate-600 mt-1">
        <span className="italic">{behavioralIndicators[strategy]}</span>
      </p>
      <div className="mt-2">
        <p className="text-sm font-medium text-slate-700">Healthy Alternatives:</p>
        <ul className="text-sm mt-1 space-y-1 list-disc pl-5">
          {healthyAlternatives[strategy].map((alt, i) => (
            <li key={i}>{alt}</li>
          ))}
        </ul>
      </div>
    </div>
  );
};

export default StrategyInsight;
