
import React from "react";
import { Container } from "@/components/ui/Container";
import FeatureCard from "./FeatureCard";

const FeatureCardGrid = () => {
  return (
    <Container>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-16">
        {/* Card 1 */}
        <FeatureCard title="Save & highlight">
          <div className="w-full h-full bg-white rounded flex items-center justify-center">
            <img 
              src="/lovable-uploads/3189a1e1-162a-4cef-9999-dcb62b53d281.png" 
              alt="Save and highlight feature"
              className="object-contain h-full w-full rounded"
              style={{ objectPosition: "0% 20%", maxWidth: "100%" }}
            />
          </div>
        </FeatureCard>
        
        {/* Card 2 */}
        <FeatureCard title="Organize & link">
          <div className="w-full h-full bg-white rounded flex items-center justify-center">
            <div className="grid grid-cols-2 gap-2 p-2 w-full">
              <div className="bg-dusty-blue/20 h-16 rounded"></div>
              <div className="bg-dusty-blue/20 h-16 rounded"></div>
              <div className="bg-dusty-blue/20 h-16 rounded"></div>
              <div className="bg-dusty-blue/20 h-16 rounded"></div>
            </div>
          </div>
        </FeatureCard>
        
        {/* Card 3 */}
        <FeatureCard title="Narrate">
          <div className="w-full h-full bg-white rounded flex items-center justify-center">
            <div className="flex flex-col w-full space-y-4 px-4">
              <div className="bg-dusty-blue/20 h-12 rounded"></div>
              <div className="bg-dusty-blue/20 h-12 rounded"></div>
              <div className="bg-dusty-blue/20 h-12 rounded"></div>
            </div>
          </div>
        </FeatureCard>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-32">
        {/* Card 4 */}
        <FeatureCard title="Frictionless notetaking" bgColor="bg-peach-beige">
          <div className="w-full h-full bg-white rounded flex items-center justify-center">
            <div className="w-3/4 p-4">
              <div className="space-y-2">
                <div className="bg-warm-grey h-4 rounded w-full"></div>
                <div className="bg-warm-grey h-4 rounded w-full"></div>
                <div className="bg-warm-grey h-4 rounded w-3/4"></div>
                <div className="bg-warm-grey h-4 rounded w-full"></div>
                <div className="bg-warm-grey h-4 rounded w-1/2"></div>
              </div>
            </div>
          </div>
        </FeatureCard>
        
        {/* Card 5 */}
        <FeatureCard title="Smart search" bgColor="bg-sky-mist">
          <div className="w-full h-full bg-white rounded flex items-center justify-center">
            <div className="w-full max-w-xs p-4">
              <div className="border border-dusty-blue/30 rounded-lg p-3 shadow-sm">
                <div className="flex items-center">
                  <div className="h-6 w-6 rounded-md bg-dusty-blue/50 mr-3 flex items-center justify-center text-white font-bold">
                    S
                  </div>
                  <div className="bg-warm-grey h-4 rounded w-full"></div>
                </div>
              </div>
            </div>
          </div>
        </FeatureCard>
      </div>
    </Container>
  );
};

export default FeatureCardGrid;
