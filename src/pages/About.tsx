
import React from "react";
import { Container } from "@/components/ui/Container";
import { PageHeader } from "@/components/ui/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import NavBar from "@/components/LandingNavBar";

const About: React.FC = () => {
  return (
    <div className="flex flex-col min-h-screen">
      <NavBar />
      <Container>
        <div className="py-8">
          <PageHeader
            title="About Attune"
            description="Understanding our mission and approach"
          />
          
          <div className="space-y-8 mt-8">
            {/* Mission Statement Section */}
            <Card>
              <CardHeader>
                <CardTitle className="text-2xl">Our Mission</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-lg">
                  Attune is dedicated to helping people repair and strengthen their relationships through 
                  evidence-based approaches and compassionate guidance.
                </p>
                <p>
                  Every intimate relationship experiences phases of disharmony. What truly matters is how 
                  we navigate these challenges and work toward repair. Attune provides the tools, insights, 
                  and support needed to transform conflict into connection and build healthier relationship 
                  patterns.
                </p>
                <p>
                  We believe that with the right guidance and practice, anyone can develop the skills needed 
                  to create and maintain fulfilling, respectful relationships that stand the test of time.
                </p>
              </CardContent>
            </Card>
            
            <Separator />
            
            {/* Bio Section */}
            <Card>
              <CardHeader>
                <CardTitle className="text-2xl">About Terry Real</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p>
                  Terry Real is a nationally recognized family therapist, author, and founder of the 
                  Relational Life Institute. For over thirty years, Terry has worked with thousands of 
                  individuals and couples, specializing in male psychology and relationships.
                </p>
                <p>
                  As the creator of Relational Life Therapy (RLT), Terry has transformed our understanding 
                  of how to work effectively with men and couples. His approach breaks with traditional 
                  therapeutic models, offering a direct and effective methodology that engages even the most 
                  reluctant clients.
                </p>
                <p>
                  Terry's work has been featured in numerous publications including The New York Times, 
                  The Wall Street Journal, and The Washington Post. He is the author of several bestselling 
                  books including "I Don't Want to Talk About It," "How Can I Get Through to You?", "The New 
                  Rules of Marriage," and "Us: Getting Past You & Me to Build a More Loving Relationship."
                </p>
                <p className="text-muted-foreground mt-4">
                  Attune is inspired by Terry Real's pioneering work in Relational Life Therapy, 
                  bringing his proven methodology to a wider audience through innovative technology.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </Container>
      
      <footer className="mt-auto text-center py-6 text-xs text-gray-500 border-t border-gray-200">
        Attune<br />
        Napkin LLC — Zurich
      </footer>
    </div>
  );
};

export default About;
