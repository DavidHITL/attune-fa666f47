
import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { 
  fetchTherapyConcepts, 
  fetchTherapySources,
  searchKnowledgeBase
} from "@/services/terryRealKnowledgeService";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Loader2, Search, FileText, ArrowUpDown } from "lucide-react";
import { toast } from "@/hooks/use-toast";

const KnowledgeBaseVerifier: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [activeTab, setActiveTab] = useState<string>("sources");
  const [sortField, setSortField] = useState<string>("title");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");

  // Fetch all sources and concepts
  const { 
    data: sources, 
    isLoading: isLoadingSources,
    refetch: refetchSources
  } = useQuery({
    queryKey: ['therapy-sources'],
    queryFn: () => fetchTherapySources(),
  });
  
  const { 
    data: concepts, 
    isLoading: isLoadingConcepts,
    refetch: refetchConcepts
  } = useQuery({
    queryKey: ['therapy-concepts'],
    queryFn: () => fetchTherapyConcepts(),
  });

  const handleSort = (field: string) => {
    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDirection("asc");
    }
  };

  const handleSearch = async () => {
    if (!searchTerm.trim()) {
      await refetchSources();
      await refetchConcepts();
      return;
    }
    
    try {
      const results = await searchKnowledgeBase(searchTerm);
      if (results) {
        toast({
          title: "Search Results",
          description: `Found ${results.sources?.length || 0} sources and ${results.concepts?.length || 0} concepts.`,
        });
      }
    } catch (error) {
      toast({
        title: "Search Error",
        description: "Failed to search knowledge base.",
        variant: "destructive",
      });
    }
  };

  // Sort the data
  const sortedSources = sources ? [...sources].sort((a, b) => {
    // Make sure the fields exist
    const aValue = a[sortField as keyof typeof a] || "";
    const bValue = b[sortField as keyof typeof b] || "";
    
    // Compare based on type
    if (typeof aValue === "string" && typeof bValue === "string") {
      return sortDirection === "asc" 
        ? aValue.localeCompare(bValue)
        : bValue.localeCompare(aValue);
    } else {
      // For non-string types
      if (aValue < bValue) return sortDirection === "asc" ? -1 : 1;
      if (aValue > bValue) return sortDirection === "asc" ? 1 : -1;
      return 0;
    }
  }) : [];

  const sortedConcepts = concepts ? [...concepts].sort((a, b) => {
    const aValue = a[sortField as keyof typeof a] || "";
    const bValue = b[sortField as keyof typeof b] || "";
    
    if (typeof aValue === "string" && typeof bValue === "string") {
      return sortDirection === "asc" 
        ? aValue.localeCompare(bValue)
        : bValue.localeCompare(aValue);
    } else {
      if (aValue < bValue) return sortDirection === "asc" ? -1 : 1;
      if (aValue > bValue) return sortDirection === "asc" ? 1 : -1;
      return 0;
    }
  }) : [];

  return (
    <Card className="w-full border border-apple-gray-5 rounded-lg shadow-sm">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-xl">Knowledge Base Content Verification</CardTitle>
        </div>
        <div className="flex space-x-2">
          <Input
            type="search"
            placeholder="Search knowledge base..."
            className="w-full"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
          />
          <Button 
            onClick={handleSearch}
            variant="secondary"
          >
            <Search className="h-4 w-4 mr-2" />
            Search
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="sources" value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="mb-4">
            <TabsTrigger value="sources">
              <FileText className="h-4 w-4 mr-2" />
              Sources ({sources?.length || 0})
            </TabsTrigger>
            <TabsTrigger value="concepts">
              <FileText className="h-4 w-4 mr-2" />
              Concepts ({concepts?.length || 0})
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="sources">
            {isLoadingSources ? (
              <div className="flex justify-center p-4">
                <Loader2 className="h-6 w-6 animate-spin" />
              </div>
            ) : sortedSources?.length > 0 ? (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead onClick={() => handleSort("title")} className="cursor-pointer">
                        Title <ArrowUpDown className="inline h-3 w-3 ml-1" />
                      </TableHead>
                      <TableHead onClick={() => handleSort("author")} className="cursor-pointer">
                        Author <ArrowUpDown className="inline h-3 w-3 ml-1" />
                      </TableHead>
                      <TableHead onClick={() => handleSort("year")} className="cursor-pointer">
                        Year <ArrowUpDown className="inline h-3 w-3 ml-1" />
                      </TableHead>
                      <TableHead onClick={() => handleSort("type")} className="cursor-pointer">
                        Type <ArrowUpDown className="inline h-3 w-3 ml-1" />
                      </TableHead>
                      <TableHead>Keywords</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {sortedSources.map((source) => (
                      <TableRow key={source.id}>
                        <TableCell className="font-medium">{source.title}</TableCell>
                        <TableCell>{source.author}</TableCell>
                        <TableCell>{source.year}</TableCell>
                        <TableCell>{source.type}</TableCell>
                        <TableCell>
                          <div className="flex flex-wrap gap-1">
                            {source.keywords?.slice(0, 3).map((keyword, i) => (
                              <span key={i} className="px-2 py-0.5 bg-gray-100 text-xs rounded-full">
                                {keyword}
                              </span>
                            ))}
                            {source.keywords && source.keywords.length > 3 && (
                              <span className="px-2 py-0.5 bg-gray-100 text-xs rounded-full">
                                +{source.keywords.length - 3} more
                              </span>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            ) : (
              <div className="text-center py-8">
                <p className="text-muted-foreground">No sources found in knowledge base.</p>
              </div>
            )}
          </TabsContent>
          
          <TabsContent value="concepts">
            {isLoadingConcepts ? (
              <div className="flex justify-center p-4">
                <Loader2 className="h-6 w-6 animate-spin" />
              </div>
            ) : sortedConcepts?.length > 0 ? (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead onClick={() => handleSort("name")} className="cursor-pointer">
                        Name <ArrowUpDown className="inline h-3 w-3 ml-1" />
                      </TableHead>
                      <TableHead onClick={() => handleSort("category")} className="cursor-pointer">
                        Category <ArrowUpDown className="inline h-3 w-3 ml-1" />
                      </TableHead>
                      <TableHead>Description</TableHead>
                      <TableHead>Examples</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {sortedConcepts.map((concept) => (
                      <TableRow key={concept.id}>
                        <TableCell className="font-medium">{concept.name}</TableCell>
                        <TableCell>
                          <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">
                            {concept.category.replace(/_/g, ' ')}
                          </span>
                        </TableCell>
                        <TableCell className="max-w-xs truncate">
                          {concept.description.length > 100 
                            ? `${concept.description.substring(0, 100)}...` 
                            : concept.description}
                        </TableCell>
                        <TableCell>
                          {concept.examples && concept.examples.length > 0 
                            ? concept.examples.length === 1 
                              ? concept.examples[0].substring(0, 50) + (concept.examples[0].length > 50 ? '...' : '')
                              : `${concept.examples.length} example(s)` 
                            : "No examples"}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            ) : (
              <div className="text-center py-8">
                <p className="text-muted-foreground">No concepts found in knowledge base.</p>
              </div>
            )}
          </TabsContent>
        </Tabs>
        
        <div className="mt-4 text-sm text-muted-foreground">
          <p>Content Count: {activeTab === "sources" ? sources?.length || 0 : concepts?.length || 0} items</p>
        </div>
      </CardContent>
    </Card>
  );
};

export default KnowledgeBaseVerifier;
