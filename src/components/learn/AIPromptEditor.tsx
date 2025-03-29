
import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BrainCircuit, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/context/AuthContext";

const formSchema = z.object({
  system_prompt: z.string().min(10, {
    message: "System prompt must be at least 10 characters.",
  }),
  exploration_phase: z.string().min(10, {
    message: "Exploration phase instructions must be at least 10 characters.",
  }),
  analysis_phase: z.string().min(10, {
    message: "Analysis phase instructions must be at least 10 characters.",
  }),
  reflection_phase: z.string().min(10, {
    message: "Reflection phase instructions must be at least 10 characters.",
  }),
});

type FormData = z.infer<typeof formSchema>;

const AIPromptEditor: React.FC = () => {
  const { user } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      system_prompt: `You are Terry Real, a renowned couples therapist and author of several books on relationships.

CORE PRINCIPLES:
- Relationships cycle through harmony, disharmony, and repair
- Five "losing strategies" damage relationships: being right, controlling, withdrawal, unbridled self-expression, and retaliation
- Practice "full-respect living" - treating yourself and others with dignity
- Help users move from "self-centered" to "relational" on the Relationship Grid
- Distinguish between adaptive child responses and functional adult responses
- Guide "relational reckoning" - deciding if what you get is worth what you don't
- Promote healthy boundaries, fierce intimacy, and cherishing vulnerabilities`,

      exploration_phase: `You are in the EXPLORATION phase (first ~10 minutes of the session).
FOCUS ON:
- Creating a safe space for the user to share their thoughts and feelings
- Asking open-ended questions to help them explore their situation
- Listening without judgment and avoiding premature conclusions
- Helping them open up about what's truly bothering them
- If they don't have a current topic, gently bring up themes from previous conversations
- Use reflective listening to show you understand their perspective`,

      analysis_phase: `You are in the ANALYSIS phase (middle ~10 minutes of the session).
FOCUS ON:
- Identifying patterns in their sharing and gently pointing these out
- Connecting new information to insights from previous conversations when relevant
- Specifically looking for and addressing:
  1) Losing strategies (being right, controlling, withdrawal, unbridled self-expression, retaliation)
  2) Relationship dynamics and patterns
  3) Cognitive patterns and thought distortions
- Asking deeper questions to promote reflection
- Helping them see connections they might have missed
- Providing a balance of support and gentle challenge`,

      reflection_phase: `You are in the REFLECTION phase (final ~5 minutes of the session).
FOCUS ON:
- Providing a supportive summary of key insights from the conversation
- Helping them connect the dots between different parts of the discussion
- Highlighting positive changes they've made or could make
- Reinforcing their growth potential and strengths
- Suggesting one simple, actionable step they might consider
- Ending on an encouraging note about their journey
- Preparing them for the session to end soon in a supportive way`,
    },
  });

  const onSubmit = async (data: FormData) => {
    if (!user) {
      console.error("Authentication required to update AI prompts");
      return;
    }

    setIsSubmitting(true);
    
    try {
      const response = await supabase.functions.invoke('updatePrompt', {
        body: {
          system_prompt: data.system_prompt,
          phase_instructions: {
            exploration: data.exploration_phase,
            analysis: data.analysis_phase,
            reflection: data.reflection_phase
          }
        }
      });
      
      if (!response.data?.success) {
        throw new Error(response.data?.error || "Failed to update prompts");
      }
      
      console.log("AI system prompts have been successfully updated");
    } catch (error) {
      console.error("Error updating prompts:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card className="w-full border border-apple-gray-5 rounded-lg shadow-sm">
      <CardHeader>
        <div className="flex items-center gap-2">
          <BrainCircuit className="h-5 w-5 text-apple-blue" />
          <CardTitle className="text-xl">AI System Prompts</CardTitle>
        </div>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <Tabs defaultValue="system">
              <TabsList className="mb-4">
                <TabsTrigger value="system">Core System</TabsTrigger>
                <TabsTrigger value="exploration">Exploration Phase</TabsTrigger>
                <TabsTrigger value="analysis">Analysis Phase</TabsTrigger>
                <TabsTrigger value="reflection">Reflection Phase</TabsTrigger>
              </TabsList>
              
              <TabsContent value="system">
                <FormField
                  control={form.control}
                  name="system_prompt"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Core System Prompt</FormLabel>
                      <FormControl>
                        <Textarea 
                          className="h-[400px] font-mono text-sm" 
                          {...field} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </TabsContent>
              
              <TabsContent value="exploration">
                <FormField
                  control={form.control}
                  name="exploration_phase"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Exploration Phase Instructions</FormLabel>
                      <FormControl>
                        <Textarea 
                          className="h-[400px] font-mono text-sm" 
                          {...field} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </TabsContent>
              
              <TabsContent value="analysis">
                <FormField
                  control={form.control}
                  name="analysis_phase"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Analysis Phase Instructions</FormLabel>
                      <FormControl>
                        <Textarea 
                          className="h-[400px] font-mono text-sm" 
                          {...field} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </TabsContent>
              
              <TabsContent value="reflection">
                <FormField
                  control={form.control}
                  name="reflection_phase"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Reflection Phase Instructions</FormLabel>
                      <FormControl>
                        <Textarea 
                          className="h-[400px] font-mono text-sm" 
                          {...field} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </TabsContent>
            </Tabs>
            
            <div className="flex justify-end">
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Update AI Prompts
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
};

export default AIPromptEditor;
