
import React from "react";
import { Radar } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ChartContainer } from "@/components/ui/chart";
import {
  ResponsiveContainer,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Tooltip,
  Radar as RadarPlot
} from "recharts";

// Interface for the profile data from users_profile table
interface UserProfileData {
  beingright_value: number | null;
  unbridledselfexpression_value: number | null;
  controlling_value: number | null;
  retaliation_value: number | null;
  withdrawal_value: number | null;
}

interface LosingStrategiesCardProps {
  profileData?: UserProfileData;
}

const LosingStrategiesCard: React.FC<LosingStrategiesCardProps> = ({ profileData }) => {
  // Dummy data for the radar chart (if no real data available)
  const dummyChartData = [
    { subject: 'Being Right', value: 3.5, fullMark: 5 },
    { subject: 'Unbridled Self Expression', value: 2.7, fullMark: 5 },
    { subject: 'Controlling', value: 4.2, fullMark: 5 },
    { subject: 'Retaliation', value: 1.8, fullMark: 5 },
    { subject: 'Withdrawal', value: 3.1, fullMark: 5 },
  ];

  // Prepare data for the radar chart
  const prepareChartData = (data: UserProfileData | undefined) => {
    if (!data) return dummyChartData;

    // Replace null values with 0 and prepare data structure for the chart
    return [
      {
        subject: 'Being Right',
        value: data.beingright_value ?? 0,
        fullMark: 5,
      },
      {
        subject: 'Unbridled Self Expression',
        value: data.unbridledselfexpression_value ?? 0,
        fullMark: 5,
      },
      {
        subject: 'Controlling',
        value: data.controlling_value ?? 0,
        fullMark: 5,
      },
      {
        subject: 'Retaliation',
        value: data.retaliation_value ?? 0,
        fullMark: 5,
      },
      {
        subject: 'Withdrawal',
        value: data.withdrawal_value ?? 0,
        fullMark: 5,
      },
    ];
  };

  const chartData = prepareChartData(profileData);
  const chartConfig = {
    userValues: {
      label: "Your Values",
      color: "#2563EB", // Blue color
    },
  };

  return (
    <Card className="border border-apple-gray-5 rounded-lg shadow-sm">
      <CardHeader className="flex flex-row items-center gap-2">
        <Radar className="h-5 w-5 text-apple-blue" />
        <CardTitle className="text-xl">Losing Strategies</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-[300px] w-full">
          <ChartContainer config={chartConfig} className="h-full">
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart>
                <PolarGrid />
                <PolarAngleAxis dataKey="subject" />
                <PolarRadiusAxis domain={[0, 5]} />
                <Tooltip />
                <RadarPlot
                  name="Your Values"
                  dataKey="value"
                  stroke="#2563EB"
                  fill="#2563EB"
                  fillOpacity={0.6}
                  data={chartData}
                />
              </RadarChart>
            </ResponsiveContainer>
          </ChartContainer>
        </div>
        <div className="mt-4">
          <p className="text-sm text-muted-foreground">
            This visualization shows your tendency toward five losing strategies in communication.
            Lower scores indicate healthier communication patterns.
          </p>
        </div>
      </CardContent>
    </Card>
  );
};

export default LosingStrategiesCard;
