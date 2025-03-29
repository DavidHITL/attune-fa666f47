
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.21.0";

// Define CORS headers for the function
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Process the analysis queue
serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Create a Supabase client with the service role key for elevated access
    const supabaseUrl = Deno.env.get("SUPABASE_URL") as string;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") as string;
    
    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error("Missing Supabase environment variables");
    }

    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    });

    console.log("Checking for unprocessed analysis requests...");

    // Fetch unprocessed analysis requests
    const { data: unprocessedRequests, error: fetchError } = await supabaseAdmin
      .from('analysis_queue')
      .select('id, user_id, created_at')
      .eq('processed', false)
      .order('created_at', { ascending: true })
      .limit(5); // Process in batches to avoid timeouts

    if (fetchError) {
      throw new Error(`Error fetching unprocessed requests: ${fetchError.message}`);
    }

    if (!unprocessedRequests || unprocessedRequests.length === 0) {
      console.log("No unprocessed analysis requests found.");
      return new Response(
        JSON.stringify({ message: "No unprocessed analysis requests found" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`Found ${unprocessedRequests.length} unprocessed requests to process`);
    
    // Process each request
    const results = await Promise.all(unprocessedRequests.map(async (request) => {
      try {
        console.log(`Processing analysis for user: ${request.user_id}`);
        
        // Call the analyzeUserPatterns function for this user
        const response = await fetch(`${supabaseUrl}/functions/v1/analyzeUserPatterns`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${supabaseServiceKey}`,
          },
          body: JSON.stringify({ user_id: request.user_id })
        });

        if (!response.ok) {
          const errorText = await response.text();
          throw new Error(`Analysis failed for user ${request.user_id}: ${errorText}`);
        }

        // Mark this request as processed
        const { error: updateError } = await supabaseAdmin
          .from('analysis_queue')
          .update({ processed: true })
          .eq('id', request.id);

        if (updateError) {
          throw new Error(`Failed to mark request ${request.id} as processed: ${updateError.message}`);
        }

        return {
          request_id: request.id,
          user_id: request.user_id,
          status: 'success'
        };
      } catch (error) {
        console.error(`Error processing request ${request.id}:`, error);
        return {
          request_id: request.id,
          user_id: request.user_id,
          status: 'error',
          error: error.message
        };
      }
    }));

    return new Response(
      JSON.stringify({ 
        message: `Processed ${unprocessedRequests.length} analysis requests`,
        results 
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
    
  } catch (error) {
    console.error("Error in processAnalysisQueue function:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 500, 
        headers: { ...corsHeaders, "Content-Type": "application/json" } 
      }
    );
  }
});
