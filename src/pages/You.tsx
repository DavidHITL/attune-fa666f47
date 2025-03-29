import React from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/context/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import NavBar from "@/components/NavBar";
import { Button } from "@/components/ui/button";
import { LogOut, MessageCircle, Radar } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { ChartContainer, ChartLegend } from "@/components/ui/chart";
import {
  Radar as RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  ResponsiveContainer,
  Tooltip
} from "recharts";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";

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

  // Dummy chat sessions count
  const sessionsLeft = 3;

  return (
    <div className="flex flex-col min-h-screen">
      <NavBar />
      <div className="flex-1 container mx-auto py-8 px-4 flex flex-col space-y-6">
        <h1 className="text-2xl font-semibold mb-2">Your Dashboard</h1>
        
        {/* Chat Sessions Left */}
        <Card className="border border-apple-gray-5 rounded-lg shadow-sm">
          <CardHeader className="flex flex-row items-center gap-2">
            <MessageCircle className="h-5 w-5 text-apple-blue" />
            <CardTitle className="text-xl">Chat Sessions</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{sessionsLeft} left this week</p>
            <p className="text-muted-foreground text-sm">Your sessions reset every Monday</p>
          </CardContent>
        </Card>
        
        {/* Keep in Mind */}
        <Card className="border border-apple-gray-5 rounded-lg shadow-sm">
          <CardHeader>
            <CardTitle className="text-xl">Keep in Mind</CardTitle>
            <CardDescription>Key insights from your conversations</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {user ? (
                <>
                  <div className="space-y-2">
                    <h3 className="font-medium">Topic 1: Communication Style</h3>
                    <p className="text-muted-foreground text-sm">You tend to withdraw during conflicts. Consider expressing your needs more directly.</p>
                  </div>
                  <Separator />
                  <div className="space-y-2">
                    <h3 className="font-medium">Topic 2: Listening Skills</h3>
                    <p className="text-muted-foreground text-sm">You excel at active listening but sometimes interrupt to express your perspective.</p>
                  </div>
                </>
              ) : (
                <p className="text-muted-foreground italic">We need to talk before we can be sure about your most important challenges.</p>
              )}
            </div>
          </CardContent>
        </Card>
        
        {/* Losing Strategies */}
        <Card className="border border-apple-gray-5 rounded-lg shadow-sm">
          <CardHeader className="flex flex-row items-center gap-2">
            <Radar className="h-5 w-5 text-apple-blue" />
            <CardTitle className="text-xl">Losing Strategies</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[300px] w-full">
              <ChartContainer 
                config={chartConfig}
                className="h-full"
              >
                <ResponsiveContainer width="100%" height="100%">
                  <RadarChart data={chartData} outerRadius={90}>
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
            <div className="mt-4">
              <p className="text-sm text-muted-foreground">
                This visualization shows your tendency toward five losing strategies in communication.
                Lower scores indicate healthier communication patterns.
              </p>
            </div>
          </CardContent>
        </Card>
        
        {/* Partner */}
        <Card className="border border-apple-gray-5 rounded-lg shadow-sm">
          <CardHeader>
            <CardTitle className="text-xl">Partner</CardTitle>
            <CardDescription>Connect with your partner</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="font-medium">Partner Linked:</span>
                <span className="text-muted-foreground">No</span>
              </div>
              <div className="flex flex-col sm:flex-row gap-3">
                <Button className="bg-apple-blue hover:bg-opacity-90" size="lg">Generate Code</Button>
                <Button variant="outline" size="lg">Send to Partner</Button>
              </div>
            </div>
          </CardContent>
        </Card>
        
        {/* Sign Out */}
        <div className="mt-2 mb-6 flex justify-center">
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
