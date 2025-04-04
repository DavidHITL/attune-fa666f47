
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
          bgColor="bg-orange-50"
        >
          <div className="bg-white rounded-lg p-4 shadow-sm">
            <div className="space-y-2">
              <div className="bg-gray-100 h-4 rounded w-3/4"></div>
              <div className="bg-gray-100 h-4 rounded w-full"></div>
              <div className="bg-gray-100 h-4 rounded w-4/5"></div>
              <div className="bg-gray-100 h-4 rounded w-full"></div>
              <div className="bg-gray-100 h-4 rounded w-2/3"></div>
            </div>
          </div>
        </FeatureDescription>
        
        {/* Feature 2 */}
        <FeatureDescription 
          title="Smart search"
          description="Find facts, ideas, and resources by keyword. Learn more."
          bgColor="bg-orange-50"
        >
          <div className="flex justify-center">
            <div className="relative">
              <div className="w-64 h-48 border border-gray-200 bg-white rounded-md shadow-md"></div>
              <div className="absolute top-1/2 right-0 transform translate-x-1/3 -translate-y-1/2 bg-white rounded-md shadow-md px-4 py-2 flex items-center">
                <div className="mr-2 bg-blue-100 text-blue-500 w-8 h-8 rounded-md flex items-center justify-center">S</div>
                <span>Search</span>
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
          bgColor=""
        >
          <></>
        </FeatureDescription>
        
        {/* Feature 4 */}
        <FeatureDescription 
          title="Integrate with tools you love"
          description="Send your highlights to Logseq, Obsidian, and Notion."
          bgColor="bg-blue-50"
        >
          <></>
        </FeatureDescription>
      </div>
    </Container>
  );
};

export default FeatureDescriptionGrid;
