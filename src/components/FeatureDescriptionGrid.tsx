
import React from "react";
import { Container } from "@/components/ui/Container";
import FeatureDescription from "./FeatureDescription";

const FeatureDescriptionGrid = () => {
  return (
    <Container>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-16">
        {/* Feature 1 */}
        <FeatureDescription 
          title="Frictionless notetaking"
          description="Highlight and write notes, easye notes on your favorites."
          bgColor="bg-peach-beige"
        >
          <div className="bg-white rounded-lg p-4 shadow-sm">
            <div className="space-y-2">
              <div className="bg-warm-grey h-4 rounded w-3/4"></div>
              <div className="bg-warm-grey h-4 rounded w-full"></div>
              <div className="bg-warm-grey h-4 rounded w-4/5"></div>
              <div className="bg-warm-grey h-4 rounded w-full"></div>
              <div className="bg-warm-grey h-4 rounded w-2/3"></div>
            </div>
          </div>
        </FeatureDescription>
        
        {/* Feature 2 */}
        <FeatureDescription 
          title="Smart search"
          description="Find facts, ideas, and resources by keyword. Learn more."
          bgColor="bg-peach-beige"
        >
          <div className="flex justify-center">
            <div className="relative">
              <div className="w-64 h-48 border border-dusty-blue/30 bg-white rounded-md shadow-md"></div>
              <div className="absolute top-1/2 right-0 transform translate-x-1/3 -translate-y-1/2 bg-white rounded-md shadow-md px-4 py-2 flex items-center">
                <div className="mr-2 bg-dusty-blue text-white w-8 h-8 rounded-md flex items-center justify-center">S</div>
                <span className="text-charcoal">Search</span>
              </div>
            </div>
          </div>
        </FeatureDescription>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-24" id="how-section">
        {/* Feature 3 */}
        <FeatureDescription 
          title="Read without distraction"
          description="Readability mode. Read-diable for EPUBs and web."
          bgColor="bg-sky-mist"
        >
          <div className="bg-white rounded-lg p-4 shadow-sm overflow-hidden">
            <div className="space-y-2">
              <div className="bg-dusty-blue/20 h-6 rounded w-1/2 mb-4"></div>
              <div className="bg-dusty-blue/20 h-4 rounded w-full"></div>
              <div className="bg-dusty-blue/20 h-4 rounded w-full"></div>
              <div className="bg-dusty-blue/20 h-4 rounded w-3/4"></div>
              <div className="bg-dusty-blue/20 h-4 rounded w-full"></div>
            </div>
          </div>
        </FeatureDescription>
        
        {/* Feature 4 */}
        <FeatureDescription 
          title="Integrate with tools you love"
          description="Send your highlights to Logseq, Obsidian, and Notion."
          bgColor="bg-sky-mist"
        >
          <div className="flex justify-center space-x-4">
            <div className="bg-white w-16 h-16 rounded-full flex items-center justify-center shadow-sm">
              <div className="w-8 h-8 bg-dusty-blue/30 rounded-md"></div>
            </div>
            <div className="bg-white w-16 h-16 rounded-full flex items-center justify-center shadow-sm">
              <div className="w-8 h-8 bg-dusty-blue/30 rounded-md"></div>
            </div>
            <div className="bg-white w-16 h-16 rounded-full flex items-center justify-center shadow-sm">
              <div className="w-8 h-8 bg-dusty-blue/30 rounded-md"></div>
            </div>
          </div>
        </FeatureDescription>
      </div>
    </Container>
  );
};

export default FeatureDescriptionGrid;
