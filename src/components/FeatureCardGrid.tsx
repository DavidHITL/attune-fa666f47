
import React from "react";
import { Container } from "@/components/ui/Container";
import FeatureCard from "./FeatureCard";

const FeatureCardGrid = () => {
  return (
    <Container>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-16">
        {/* Card 1 */}
        <FeatureCard title="Save & highlight">
          <div className="w-3/4 h-32 bg-gray-100 rounded flex items-center justify-center">
            <span className="text-gray-400">Image</span>
          </div>
        </FeatureCard>
        
        {/* Card 2 */}
        <FeatureCard title="Organize & link">
          <div className="grid grid-cols-2 gap-2 w-full">
            <div className="bg-gray-100 h-16 rounded"></div>
            <div className="bg-gray-100 h-16 rounded"></div>
            <div className="bg-gray-100 h-16 rounded"></div>
            <div className="bg-gray-100 h-16 rounded"></div>
          </div>
        </FeatureCard>
        
        {/* Card 3 */}
        <FeatureCard title="Narrate">
          <div className="flex flex-col w-full space-y-4">
            <div className="bg-gray-100 h-16 rounded"></div>
            <div className="bg-gray-100 h-16 rounded"></div>
          </div>
        </FeatureCard>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-32">
        {/* Card 4 */}
        <FeatureCard title="Frictionless notetaking" bgColor="bg-orange-50">
          <div className="w-3/4 h-32 bg-gray-100 rounded"></div>
        </FeatureCard>
        
        {/* Card 5 */}
        <FeatureCard title="Smart search" bgColor="bg-gray-100">
          <div className="w-3/4 h-32 bg-gray-100 rounded flex items-center justify-center">
            <div className="w-3/5 h-24 border border-gray-200 rounded-sm"></div>
          </div>
        </FeatureCard>
      </div>
    </Container>
  );
};

export default FeatureCardGrid;
