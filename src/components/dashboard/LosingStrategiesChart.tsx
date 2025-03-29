
import React from "react";
import {
  ResponsiveContainer,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Tooltip,
  Radar
} from "recharts";
import { ChartContainer } from "@/components/ui/chart";

// Chart data interface
export interface StrategyChartData {
  subject: string;
  value: number;
  fullMark: number;
}

interface LosingStrategiesChartProps {
  chartData: StrategyChartData[];
}

const LosingStrategiesChart: React.FC<LosingStrategiesChartProps> = ({ chartData }) => {
  const chartConfig = {
    userValues: {
      label: "Your Values",
      color: "#2563EB", // Blue color
    },
  };

  return (
    <div className="h-[300px] w-full">
      <ChartContainer config={chartConfig} className="h-full">
        <ResponsiveContainer width="100%" height="100%">
          <RadarChart data={chartData}>
            <PolarGrid />
            <PolarAngleAxis dataKey="subject" />
            <PolarRadiusAxis domain={[0, 5]} />
            <Tooltip />
            <Radar
              name="Your Values"
              dataKey="value"
              stroke="#2563EB"
              fill="#2563EB"
              fillOpacity={0.6}
            />
          </RadarChart>
        </ResponsiveContainer>
      </ChartContainer>
    </div>
  );
};

export default LosingStrategiesChart;
