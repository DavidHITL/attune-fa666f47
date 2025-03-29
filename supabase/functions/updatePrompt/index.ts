
import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.21.0";

// Define the cors headers for the response
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface PromptUpdateRequest {
  system_prompt: string;
  phase_instructions?: {
    exploration?: string;
    analysis?: string;
    reflection?: string;
  };
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL") as string;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") as string;

    // Create a Supabase client with service role key for elevated access
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    });

    // Parse request body
    const { system_prompt, phase_instructions } = await req.json() as PromptUpdateRequest;

    if (!system_prompt) {
      return new Response(
        JSON.stringify({ error: "Missing system_prompt parameter" }),
        { 
          status: 400, 
          headers: { ...corsHeaders, "Content-Type": "application/json" } 
        }
      );
    }

    console.log(`Updating AI system prompt`);

    // Insert or update the system prompt in the AI configuration table
    const { data: promptUpdate, error: promptError } = await supabaseAdmin
      .from('ai_configuration')
      .upsert({
        id: 'system_prompt',
        value: system_prompt,
        updated_at: new Date().toISOString()
      });

    if (promptError) {
      console.error("Error updating system prompt:", promptError);
      return new Response(
        JSON.stringify({ error: "Failed to update system prompt", details: promptError }),
        { 
          status: 500, 
          headers: { ...corsHeaders, "Content-Type": "application/json" } 
        }
      );
    }

    // Update phase instructions if provided
    if (phase_instructions) {
      const phaseUpdates = [];
      
      if (phase_instructions.exploration) {
        phaseUpdates.push({
          id: 'exploration_phase',
          value: phase_instructions.exploration,
          updated_at: new Date().toISOString()
        });
      }
      
      if (phase_instructions.analysis) {
        phaseUpdates.push({
          id: 'analysis_phase',
          value: phase_instructions.analysis,
          updated_at: new Date().toISOString()
        });
      }
      
      if (phase_instructions.reflection) {
        phaseUpdates.push({
          id: 'reflection_phase',
          value: phase_instructions.reflection,
          updated_at: new Date().toISOString()
        });
      }
      
      if (phaseUpdates.length > 0) {
        const { error: phaseError } = await supabaseAdmin
          .from('ai_configuration')
          .upsert(phaseUpdates);
          
        if (phaseError) {
          console.error("Error updating phase instructions:", phaseError);
          return new Response(
            JSON.stringify({ error: "Failed to update phase instructions", details: phaseError }),
            { 
              status: 500, 
              headers: { ...corsHeaders, "Content-Type": "application/json" } 
            }
          );
        }
      }
    }

    // Return success response
    return new Response(
      JSON.stringify({
        success: true,
        message: "AI prompts updated successfully"
      }),
      { 
        headers: { ...corsHeaders, "Content-Type": "application/json" } 
      }
    );
    
  } catch (error) {
    console.error("Error in updatePrompt function:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 500, 
        headers: { ...corsHeaders, "Content-Type": "application/json" } 
      }
    );
  }
});
