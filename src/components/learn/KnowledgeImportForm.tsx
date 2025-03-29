
import React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Upload, BookOpen } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { toast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

const formSchema = z.object({
  title: z.string().min(2, { message: "Title must be at least 2 characters." }),
  author: z.string().min(2, { message: "Author must be at least 2 characters." }),
  year: z.string().regex(/^\d{4}$/, { message: "Year must be a 4-digit number." }),
  type: z.string(),
  description: z.string().min(10, { message: "Description must be at least 10 characters." }),
  content: z.string().min(50, { message: "Content must be at least 50 characters." }),
});

type FormData = z.infer<typeof formSchema>;

const KnowledgeImportForm: React.FC = () => {
  const { user } = useAuth();
  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: "",
      author: "Terry Real",
      year: new Date().getFullYear().toString(),
      type: "book",
      description: "",
      content: "",
    },
  });
  
  const onSubmit = async (data: FormData) => {
    if (!user) {
      toast({
        title: "Authentication required",
        description: "You need to be logged in to import knowledge.",
        variant: "destructive",
      });
      return;
    }
    
    try {
      // Extract keywords from the content
      const extractKeywordsResponse = await supabase.functions.invoke('extractKeywords', {
        body: { text: data.content }
      });
      
      if (!extractKeywordsResponse.data?.success) {
        throw new Error("Failed to extract keywords");
      }
      
      const keywords = extractKeywordsResponse.data.keywords || [];
      
      // Create a summary of the content
      const summarizeResponse = await supabase.functions.invoke('summarizeContent', {
        body: { text: data.content }
      });
      
      if (!summarizeResponse.data?.success) {
        throw new Error("Failed to summarize content");
      }
      
      const contentSummary = summarizeResponse.data.summary || "";
      
      // Save the source to the database
      const { error: sourceError } = await supabase
        .from('therapy_sources')
        .insert({
          title: data.title,
          author: data.author,
          year: parseInt(data.year),
          type: data.type,
          description: data.description,
          keywords: keywords,
          content_summary: contentSummary,
          full_content: data.content,
          added_by: user.id
        });
        
      if (sourceError) {
        throw sourceError;
      }
      
      toast({
        title: "Knowledge imported",
        description: "The source has been added to the knowledge base.",
      });
      
      // Reset the form
      form.reset();
      
    } catch (error) {
      console.error("Error importing knowledge:", error);
      toast({
        title: "Import failed",
        description: error instanceof Error ? error.message : "Failed to import knowledge",
        variant: "destructive",
      });
    }
  };

  return (
    <Card className="w-full border border-apple-gray-5 rounded-lg shadow-sm">
      <CardHeader>
        <div className="flex items-center gap-2">
          <Upload className="h-5 w-5 text-apple-blue" />
          <CardTitle className="text-xl">Import Terry Real Knowledge</CardTitle>
        </div>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Title</FormLabel>
                  <FormControl>
                    <Input placeholder="Enter the title" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="author"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Author</FormLabel>
                    <FormControl>
                      <Input placeholder="Author name" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="year"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Year</FormLabel>
                    <FormControl>
                      <Input placeholder="Publication year" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            
            <FormField
              control={form.control}
              name="type"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Type</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select the type of resource" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="book">Book</SelectItem>
                      <SelectItem value="article">Article</SelectItem>
                      <SelectItem value="lecture">Lecture</SelectItem>
                      <SelectItem value="workshop">Workshop</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="Brief description of the source" 
                      className="h-20"
                      {...field} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="content"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Content</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="Paste the full content or excerpts from the source" 
                      className="h-40"
                      {...field} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <div className="flex justify-end">
              <Button type="submit" className="gap-2">
                <BookOpen className="h-4 w-4" />
                Import Knowledge
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
};

export default KnowledgeImportForm;
