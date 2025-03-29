
import React from "react";
import { Container } from "@/components/ui/Container";
import { PageHeader } from "@/components/ui/PageHeader";
import { Book } from "lucide-react";
import KnowledgeBaseExplorer from "@/components/learn/KnowledgeBaseExplorer";
import KnowledgeImportForm from "@/components/learn/KnowledgeImportForm";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/context/AuthContext";

// The Learn page - showcasing Terry Real's methodologies and concepts
export default function Learn() {
  const { user } = useAuth();
  
  return (
    <Container>
      <PageHeader
        title="Learn"
        description="Explore Terry Real's relational therapy concepts and methodologies"
        icon={<Book className="w-10 h-10" />}
      />

      <Tabs defaultValue="explore" className="mt-6">
        <TabsList className="mb-4">
          <TabsTrigger value="explore">Explore Knowledge Base</TabsTrigger>
          {user && <TabsTrigger value="import">Import Knowledge</TabsTrigger>}
        </TabsList>
        
        <TabsContent value="explore">
          <KnowledgeBaseExplorer />
        </TabsContent>
        
        {user && (
          <TabsContent value="import">
            <KnowledgeImportForm />
          </TabsContent>
        )}
      </Tabs>
    </Container>
  );
}
