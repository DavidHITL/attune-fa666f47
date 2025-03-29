
import React from "react";
import { Container } from "@/components/ui/Container";
import { PageHeader } from "@/components/ui/PageHeader";
import { Book } from "lucide-react";
import KnowledgeBaseExplorer from "@/components/learn/KnowledgeBaseExplorer";

// The Learn page - showcasing Terry Real's methodologies and concepts
export default function Learn() {
  return (
    <Container>
      <PageHeader
        title="Learn"
        description="Explore Terry Real's relational therapy concepts and methodologies"
        icon={<Book className="w-10 h-10" />}
      />

      <div className="mt-6 grid grid-cols-1 gap-6">
        <KnowledgeBaseExplorer />
      </div>
    </Container>
  );
}
