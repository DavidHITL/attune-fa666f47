
import React from "react";
import { Container } from "@/components/ui/Container";
import { useAuth } from "@/context/auth";
import NavBar from "@/components/NavBar";
import HarmonySection from "@/components/learn/HarmonySection";
import RelationalReckoningSection from "@/components/learn/RelationalReckoningSection";
import AdaptiveChildSection from "@/components/learn/AdaptiveChildSection";
import LosingStrategiesSection from "@/components/learn/LosingStrategiesSection";
import StrategiesSection from "@/components/learn/StrategiesSection";
import DeepTherapySection from "@/components/learn/DeepTherapySection";
import KnowledgeContentForm from "@/components/learn/KnowledgeContentForm";

// The Learn page - showcasing Terry Real's methodologies and concepts
export default function Learn() {
  const { user } = useAuth();
  
  return (
    <>
      <NavBar />
      <Container>
        {/* Core Content Sections - visible to all users */}
        <div className="py-6">
          <h1 className="text-3xl font-bold mb-6">Terry Real's Relational Life Therapy</h1>
          <p className="text-lg mb-8">
            Explore the key concepts and methodologies of Terry Real's approach to relationships and healing.
          </p>
          <div className="space-y-6 mb-8">
            <HarmonySection />
            <RelationalReckoningSection />
            <AdaptiveChildSection />
            <StrategiesSection />
            <LosingStrategiesSection />
            <DeepTherapySection />
          </div>
        </div>
        
        {/* Knowledge Content Form - for adding new content */}
        {user && (
          <div className="mt-10 mb-8">
            <h2 className="text-2xl font-semibold mb-4">Knowledge Base Management</h2>
            <KnowledgeContentForm />
          </div>
        )}
      </Container>
    </>
  );
}
