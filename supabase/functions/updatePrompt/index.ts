
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.31.0";
import { corsHeaders } from "../_shared/cors.ts";

const supabaseUrl = Deno.env.get("SUPABASE_URL") || "";
const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";

interface RequestBody {
  promptId: string;
  newValue: string;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, {
      headers: corsHeaders,
    });
  }

  try {
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    // Get the user ID from the authorization header
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('Authorization header is required');
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !user) {
      throw new Error('Unauthorized');
    }
    
    // Parse the request body
    const { promptId, newValue }: RequestBody = await req.json();

    if (!promptId || !newValue) {
      return new Response(
        JSON.stringify({
          success: false,
          error: "Missing required fields",
        }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 400,
        }
      );
    }

    // Update the prompt in the database
    const { data, error } = await supabase
      .from('ai_configuration')
      .update({ value: newValue, updated_at: new Date().toISOString() })
      .eq('id', promptId);

    if (error) {
      throw error;
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: "Prompt updated successfully",
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );
  } catch (error) {
    console.error("Error updating prompt:", error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      }
    );
  }
});
