
import React from "react";
import { Container } from "@/components/ui/Container";
import { useAuth } from "@/context/auth";
import NavBar from "@/components/NavBar";
import HarmonySection from "@/components/learn/HarmonySection";
import RelationalReckoningSection from "@/components/learn/RelationalReckoningSection";
import AdaptiveChildSection from "@/components/learn/AdaptiveChildSection";
import LosingStrategiesSection from "@/components/learn/LosingStrategiesSection";
import KnowledgeContentForm from "@/components/learn/KnowledgeContentForm";

// The Learn page - showcasing Terry Real's methodologies and concepts
export default function Learn() {
  const { user } = useAuth();
  
  return (
    <>
      <NavBar />
      <Container>
        {/* Core Content Sections - visible to all users */}
        <div className="space-y-6 mb-8">
          <HarmonySection />
          <RelationalReckoningSection />
          <AdaptiveChildSection />
          <LosingStrategiesSection />
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
