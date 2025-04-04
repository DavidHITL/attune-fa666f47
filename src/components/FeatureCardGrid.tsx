
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
              src="/lovable-uploads/f3b9dc7c-2918-45bb-bdbc-23e3d9da3539.png" 
              alt="Save and highlight feature"
              className="object-contain h-full w-full rounded"
              style={{ objectPosition: "0% 20%", objectFit: "none", maxWidth: "100%" }}
            />
          </div>
        </FeatureCard>
        
        {/* Card 2 */}
        <FeatureCard title="Organize & link">
          <div className="w-full h-full bg-white rounded flex items-center justify-center">
            <img 
              src="/lovable-uploads/f3b9dc7c-2918-45bb-bdbc-23e3d9da3539.png" 
              alt="Organize and link feature"
              className="object-contain h-full w-full rounded"
              style={{ objectPosition: "50% 30%", objectFit: "none", maxWidth: "100%" }}
            />
          </div>
        </FeatureCard>
        
        {/* Card 3 */}
        <FeatureCard title="Narrate">
          <div className="w-full h-full bg-white rounded flex items-center justify-center">
            <img 
              src="/lovable-uploads/f3b9dc7c-2918-45bb-bdbc-23e3d9da3539.png" 
              alt="Narrate feature"
              className="object-contain h-full w-full rounded"
              style={{ objectPosition: "100% 30%", objectFit: "none", maxWidth: "100%" }}
            />
          </div>
        </FeatureCard>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-32">
        {/* Card 4 */}
        <FeatureCard title="Frictionless notetaking" bgColor="bg-orange-50">
          <div className="w-full h-full bg-white rounded flex items-center justify-center">
            <img 
              src="/lovable-uploads/f3b9dc7c-2918-45bb-bdbc-23e3d9da3539.png" 
              alt="Frictionless notetaking feature"
              className="object-contain h-full w-full rounded"
              style={{ objectPosition: "20% 70%", objectFit: "none", maxWidth: "100%" }}
            />
          </div>
        </FeatureCard>
        
        {/* Card 5 */}
        <FeatureCard title="Smart search" bgColor="bg-gray-100">
          <div className="w-full h-full bg-white rounded flex items-center justify-center">
            <img 
              src="/lovable-uploads/f3b9dc7c-2918-45bb-bdbc-23e3d9da3539.png" 
              alt="Smart search feature"
              className="object-contain h-full w-full rounded"
              style={{ objectPosition: "70% 70%", objectFit: "none", maxWidth: "100%" }}
            />
          </div>
        </FeatureCard>
      </div>
    </Container>
  );
};

export default FeatureCardGrid;
