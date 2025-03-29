
import React, { useState } from "react";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

type ContentType = "concept" | "source";

const KnowledgeContentForm = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<ContentType>("concept");

  // Concept form state
  const [conceptName, setConceptName] = useState("");
  const [conceptDescription, setConceptDescription] = useState("");
  const [conceptCategory, setConceptCategory] = useState("core_principle");
  const [conceptExamples, setConceptExamples] = useState("");
  const [alternativeNames, setAlternativeNames] = useState("");

  // Source form state
  const [sourceTitle, setSourceTitle] = useState("");
  const [sourceAuthor, setSourceAuthor] = useState("");
  const [sourceYear, setSourceYear] = useState("");
  const [sourceType, setSourceType] = useState("book");
  const [sourceDescription, setSourceDescription] = useState("");
  const [contentSummary, setContentSummary] = useState("");
  const [fullContent, setFullContent] = useState("");
  const [keywords, setKeywords] = useState("");

  const resetForm = () => {
    if (activeTab === "concept") {
      setConceptName("");
      setConceptDescription("");
      setConceptCategory("core_principle");
      setConceptExamples("");
      setAlternativeNames("");
    } else {
      setSourceTitle("");
      setSourceAuthor("");
      setSourceYear("");
      setSourceType("book");
      setSourceDescription("");
      setContentSummary("");
      setFullContent("");
      setKeywords("");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      let payload;
      
      if (activeTab === "concept") {
        payload = {
          type: "concept",
          content: {
            name: conceptName,
            description: conceptDescription,
            category: conceptCategory,
            examples: conceptExamples.split("\n").filter(ex => ex.trim()),
            alternative_names: alternativeNames.split(",").map(name => name.trim()).filter(name => name)
          }
        };
      } else {
        payload = {
          type: "source",
          content: {
            title: sourceTitle,
            author: sourceAuthor,
            year: parseInt(sourceYear),
            type: sourceType,
            description: sourceDescription,
            content_summary: contentSummary,
            full_content: fullContent,
            keywords: keywords.split(",").map(keyword => keyword.trim()).filter(keyword => keyword)
          }
        };
      }

      // Call the Supabase Edge Function
      const { data, error } = await supabase.functions.invoke('addKnowledgeContent', { body: payload });
      
      if (error) {
        throw new Error(`Function error: ${error.message}`);
      }
      
      if (!data.success) {
        throw new Error(data.error || "Failed to add content");
      }

      toast({
        title: "Success!",
        description: `${activeTab === "concept" ? "Concept" : "Source"} has been added to the knowledge base.`,
      });
      
      resetForm();
    } catch (error) {
      console.error("Error adding content:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to add content to knowledge base",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Add Knowledge Content</CardTitle>
        <CardDescription>
          Add Terry Real content to enhance the knowledge base
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as ContentType)}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="concept">Add Concept</TabsTrigger>
            <TabsTrigger value="source">Add Source</TabsTrigger>
          </TabsList>
          
          <TabsContent value="concept">
            <form onSubmit={handleSubmit} className="space-y-4 mt-4">
              <div>
                <label className="block text-sm font-medium mb-1">Concept Name</label>
                <Input 
                  value={conceptName}
                  onChange={(e) => setConceptName(e.target.value)}
                  placeholder="e.g., Relational Reckoning"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-1">Category</label>
                <Select value={conceptCategory} onValueChange={setConceptCategory}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="core_principle">Core Principle</SelectItem>
                    <SelectItem value="strategy">Strategy</SelectItem>
                    <SelectItem value="technique">Technique</SelectItem>
                    <SelectItem value="model">Model</SelectItem>
                    <SelectItem value="framework">Framework</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-1">Description</label>
                <Textarea 
                  value={conceptDescription}
                  onChange={(e) => setConceptDescription(e.target.value)}
                  placeholder="Detailed description of the concept..."
                  rows={5}
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-1">Examples (one per line)</label>
                <Textarea 
                  value={conceptExamples}
                  onChange={(e) => setConceptExamples(e.target.value)}
                  placeholder="Example 1&#10;Example 2&#10;Example 3"
                  rows={3}
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-1">Alternative Names (comma-separated)</label>
                <Input 
                  value={alternativeNames}
                  onChange={(e) => setAlternativeNames(e.target.value)}
                  placeholder="e.g., RR, Relational Repair"
                />
              </div>
              
              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? "Adding..." : "Add Concept"}
              </Button>
            </form>
          </TabsContent>
          
          <TabsContent value="source">
            <form onSubmit={handleSubmit} className="space-y-4 mt-4">
              <div>
                <label className="block text-sm font-medium mb-1">Title</label>
                <Input 
                  value={sourceTitle}
                  onChange={(e) => setSourceTitle(e.target.value)}
                  placeholder="e.g., US: Getting Past You and Me to Build a More Loving Relationship"
                  required
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Author</label>
                  <Input 
                    value={sourceAuthor}
                    onChange={(e) => setSourceAuthor(e.target.value)}
                    placeholder="e.g., Terry Real"
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-1">Year</label>
                  <Input 
                    type="number"
                    value={sourceYear}
                    onChange={(e) => setSourceYear(e.target.value)}
                    placeholder="e.g., 2022"
                    required
                  />
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-1">Type</label>
                <Select value={sourceType} onValueChange={setSourceType}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="book">Book</SelectItem>
                    <SelectItem value="article">Article</SelectItem>
                    <SelectItem value="lecture">Lecture</SelectItem>
                    <SelectItem value="workshop">Workshop</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-1">Description</label>
                <Textarea 
                  value={sourceDescription}
                  onChange={(e) => setSourceDescription(e.target.value)}
                  placeholder="Brief description of the source..."
                  rows={3}
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-1">Content Summary</label>
                <Textarea 
                  value={contentSummary}
                  onChange={(e) => setContentSummary(e.target.value)}
                  placeholder="Summarize the key points..."
                  rows={3}
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-1">Full Content</label>
                <Textarea 
                  value={fullContent}
                  onChange={(e) => setFullContent(e.target.value)}
                  placeholder="Paste longer excerpts or full content here..."
                  rows={6}
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-1">Keywords (comma-separated)</label>
                <Input 
                  value={keywords}
                  onChange={(e) => setKeywords(e.target.value)}
                  placeholder="e.g., relationships, communication, repair"
                />
              </div>
              
              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? "Adding..." : "Add Source"}
              </Button>
            </form>
          </TabsContent>
        </Tabs>
      </CardContent>
      <CardFooter className="flex justify-between text-sm text-muted-foreground">
        <p>All content is stored securely in the database</p>
      </CardFooter>
    </Card>
  );
};

export default KnowledgeContentForm;
