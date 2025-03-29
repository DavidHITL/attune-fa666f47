
import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { 
  fetchTherapyConcepts, 
  fetchTherapySources,
  TherapyConcept,
  TherapySource
} from "@/services/terryRealKnowledgeService";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Book, 
  Search, 
  FileText, 
  Lightbulb,
  Loader2
} from "lucide-react";
import NoDataAlert from "@/components/dashboard/NoDataAlert";

const KnowledgeBaseExplorer: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState("concepts");
  
  const { 
    data: concepts,
    isLoading: isLoadingConcepts
  } = useQuery({
    queryKey: ['therapy-concepts'],
    queryFn: () => fetchTherapyConcepts(),
  });
  
  const { 
    data: sources,
    isLoading: isLoadingSources
  } = useQuery({
    queryKey: ['therapy-sources'],
    queryFn: () => fetchTherapySources(),
  });
  
  // Filter based on search query
  const filteredConcepts = concepts?.filter(concept => 
    searchQuery === "" || 
    concept.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    concept.description.toLowerCase().includes(searchQuery.toLowerCase())
  );
  
  const filteredSources = sources?.filter(source => 
    searchQuery === "" || 
    source.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    source.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
    source.content_summary?.toLowerCase().includes(searchQuery.toLowerCase())
  );
  
  return (
    <Card className="w-full border border-apple-gray-5 rounded-lg shadow-sm">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Book className="h-5 w-5 text-apple-blue" />
            <CardTitle className="text-xl">Terry Real Knowledge Base</CardTitle>
          </div>
        </div>
        <div className="relative mt-2">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Search concepts, techniques..."
            className="w-full pl-8"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="concepts" value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="mb-4">
            <TabsTrigger value="concepts">
              <Lightbulb className="h-4 w-4 mr-2" />
              Concepts
            </TabsTrigger>
            <TabsTrigger value="sources">
              <FileText className="h-4 w-4 mr-2" />
              Sources
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="concepts">
            {isLoadingConcepts ? (
              <div className="flex justify-center p-4">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : filteredConcepts && filteredConcepts.length > 0 ? (
              <div className="grid gap-3">
                {filteredConcepts.map(concept => (
                  <ConceptCard key={concept.id} concept={concept} />
                ))}
              </div>
            ) : (
              <NoDataAlert />
            )}
          </TabsContent>
          
          <TabsContent value="sources">
            {isLoadingSources ? (
              <div className="flex justify-center p-4">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : filteredSources && filteredSources.length > 0 ? (
              <div className="grid gap-3">
                {filteredSources.map(source => (
                  <SourceCard key={source.id} source={source} />
                ))}
              </div>
            ) : (
              <NoDataAlert />
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};

// Component for displaying individual concepts
const ConceptCard: React.FC<{ concept: TherapyConcept }> = ({ concept }) => {
  return (
    <div className="p-3 border rounded-md hover:bg-slate-50 transition-colors">
      <div className="flex justify-between items-start">
        <h3 className="font-medium">{concept.name}</h3>
        <span className="text-xs px-2 py-1 rounded-full bg-slate-100">
          {concept.category.replace('_', ' ')}
        </span>
      </div>
      <p className="text-sm text-muted-foreground mt-1">{concept.description}</p>
      {concept.examples && concept.examples.length > 0 && (
        <div className="mt-2">
          <p className="text-xs font-medium">Example:</p>
          <p className="text-xs italic">{concept.examples[0]}</p>
        </div>
      )}
    </div>
  );
};

// Component for displaying individual sources
const SourceCard: React.FC<{ source: TherapySource }> = ({ source }) => {
  return (
    <div className="p-3 border rounded-md hover:bg-slate-50 transition-colors">
      <div className="flex justify-between items-start">
        <h3 className="font-medium">{source.title}</h3>
        <span className="text-xs">{source.year}</span>
      </div>
      <p className="text-xs text-muted-foreground">{source.author}</p>
      <p className="text-sm mt-1">{source.description}</p>
      {source.keywords && source.keywords.length > 0 && (
        <div className="flex flex-wrap gap-1 mt-2">
          {source.keywords.map((keyword, index) => (
            <span 
              key={index} 
              className="text-xs px-2 py-0.5 rounded-full bg-slate-100"
            >
              {keyword}
            </span>
          ))}
        </div>
      )}
    </div>
  );
};

export default KnowledgeBaseExplorer;
