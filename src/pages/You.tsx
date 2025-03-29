
import React from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/context/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import NavBar from "@/components/NavBar";
import { Button } from "@/components/ui/button";
import { LogOut } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { ChartContainer, ChartLegend, ChartLegendContent } from "@/components/ui/chart";
import {
  Radar,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  ResponsiveContainer,
  Tooltip
} from "recharts";
import { Skeleton } from "@/components/ui/skeleton";

// Interface for the profile data from users_profile table
interface UserProfileData {
  beingright_value: number | null;
  unbridledselfexpression_value: number | null;
  controlling_value: number | null;
  retaliation_value: number | null;
  withdrawal_value: number | null;
}

const You: React.FC = () => {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();

  const handleSignOut = async () => {
    await signOut();
    navigate("/");
  };

  // Fetch user profile data from Supabase
  const { data: profileData, isLoading, error } = useQuery({
    queryKey: ['userProfile', user?.id],
    queryFn: async () => {
      if (!user?.id) throw new Error("User not authenticated");
      
      const { data, error } = await supabase
        .from('users_profile')
        .select('beingright_value, unbridledselfexpression_value, controlling_value, retaliation_value, withdrawal_value')
        .eq('user_id', user.id)
        .single();

      if (error) throw error;
      return data as UserProfileData;
    },
    enabled: !!user?.id,
  });

  // Prepare data for the radar chart
  const prepareChartData = (data: UserProfileData | undefined) => {
    if (!data) return [];

    // Replace null values with 0 and prepare data structure for the chart
    return [
      {
        subject: 'Being Right',
        value: data.beingright_value ?? 0,
        fullMark: 10,
      },
      {
        subject: 'Unbridled Self Expression',
        value: data.unbridledselfexpression_value ?? 0,
        fullMark: 10,
      },
      {
        subject: 'Controlling',
        value: data.controlling_value ?? 0,
        fullMark: 10,
      },
      {
        subject: 'Retaliation',
        value: data.retaliation_value ?? 0,
        fullMark: 10,
      },
      {
        subject: 'Withdrawal',
        value: data.withdrawal_value ?? 0,
        fullMark: 10,
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
    <div className="flex flex-col min-h-screen">
      <NavBar />
      <div className="flex-1 container mx-auto py-8 px-4 flex flex-col">
        <h1 className="text-2xl font-semibold mb-6">Your Profile Analysis</h1>
        
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Communication Pattern Profile</CardTitle>
            <CardDescription>
              Analysis of your communication patterns based on your interactions
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="w-full h-[300px] flex items-center justify-center">
                <Skeleton className="h-[250px] w-[250px] rounded-full" />
              </div>
            ) : error ? (
              <div className="text-center py-8 text-red-500">
                <p>Error loading profile data. Please try again later.</p>
              </div>
            ) : !chartData.length ? (
              <div className="text-center py-8 text-gray-500">
                <p>No profile data available yet. Continue chatting to generate insights.</p>
              </div>
            ) : (
              <ChartContainer 
                className="h-[300px]"
                config={chartConfig}
              >
                <RadarChart 
                  data={chartData} 
                  outerRadius={90}
                >
                  <PolarGrid />
                  <PolarAngleAxis dataKey="subject" />
                  <PolarRadiusAxis domain={[0, 10]} />
                  <Radar
                    name="Your Values"
                    dataKey="value"
                    stroke="#2563EB"
                    fill="#2563EB"
                    fillOpacity={0.6}
                  />
                  <Tooltip />
                </RadarChart>
              </ChartContainer>
            )}
          </CardContent>
        </Card>

        <Card className="mb-auto">
          <CardHeader>
            <CardTitle>Understanding Your Profile</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="mb-4">
              This spider chart represents five key communication patterns that can impact your relationships:
            </p>
            <ul className="list-disc pl-5 space-y-2">
              <li><strong>Being Right</strong>: The desire to prove your point of view is correct.</li>
              <li><strong>Unbridled Self Expression</strong>: Expressing thoughts and emotions without considering their impact.</li>
              <li><strong>Controlling</strong>: Attempts to manage situations and others' behaviors.</li>
              <li><strong>Retaliation</strong>: Responding to perceived attacks with counterattacks.</li>
              <li><strong>Withdrawal</strong>: Disengaging from difficult conversations.</li>
            </ul>
            <p className="mt-4">
              Lower scores in each area generally indicate healthier communication patterns. Continue using the app to get more insights and tips for improvement.
            </p>
          </CardContent>
        </Card>

        {/* Sign Out Button at the bottom */}
        <div className="mt-8 mb-6 flex justify-center">
          <Button 
            variant="outline" 
            onClick={handleSignOut}
            className="text-apple-gray hover:text-apple-red hover:bg-apple-gray-6 flex items-center gap-2"
          >
            <LogOut size={18} />
            Sign Out
          </Button>
        </div>
      </div>
      <footer className="text-center py-3 text-xs text-gray-500 border-t border-gray-200">
        Attune<br />
        Napkin LLC — Zurich
      </footer>
    </div>
  );
};

export default You;
