
import React from "react";
import { Container } from "@/components/ui/Container";
import KnowledgeBaseExplorer from "@/components/learn/KnowledgeBaseExplorer";
import KnowledgeImportForm from "@/components/learn/KnowledgeImportForm";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/context/auth";
import NavBar from "@/components/NavBar";

// The Learn page - showcasing Terry Real's methodologies and concepts
export default function Learn() {
  const { user, isAdmin } = useAuth();
  const showAdminFeatures = user && isAdmin();
  
  return (
    <>
      <NavBar />
      <Container>
        <Tabs defaultValue="explore" className="mt-6">
          <TabsList className="mb-4">
            <TabsTrigger value="explore">Explore Knowledge Base</TabsTrigger>
            {showAdminFeatures && <TabsTrigger value="import">Import Knowledge</TabsTrigger>}
          </TabsList>
          
          <TabsContent value="explore">
            <KnowledgeBaseExplorer />
          </TabsContent>
          
          {showAdminFeatures && (
            <TabsContent value="import">
              <KnowledgeImportForm />
            </TabsContent>
          )}
        </Tabs>
      </Container>
    </>
  );
}
