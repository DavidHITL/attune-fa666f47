
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

// Configure CORS headers for browser requests
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL') as string;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') as string;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    const { type, content } = await req.json();

    if (!type || !content) {
      return new Response(JSON.stringify({ 
        success: false, 
        error: "Missing required fields: type and content are required" 
      }), { 
        status: 400, 
        headers: { ...corsHeaders, "Content-Type": "application/json" } 
      });
    }

    // Log the incoming request for debugging
    console.log(`Processing ${type} content addition...`);

    if (type === "concept") {
      const { 
        name, 
        description, 
        category = "core_principle", 
        examples = [], 
        source_ids = [], 
        related_concept_ids = [], 
        alternative_names = [] 
      } = content;

      // Validate required fields for concept
      if (!name || !description) {
        return new Response(JSON.stringify({ 
          success: false, 
          error: "Name and description are required for concepts" 
        }), { 
          status: 400, 
          headers: { ...corsHeaders, "Content-Type": "application/json" } 
        });
      }

      // Insert the concept into the database
      const { data: conceptData, error: conceptError } = await supabase
        .from('therapy_concepts')
        .insert({
          name,
          description,
          category,
          examples,
          source_ids,
          related_concept_ids,
          alternative_names
        })
        .select('id, name')
        .single();

      if (conceptError) {
        console.error("Error inserting concept:", conceptError);
        return new Response(JSON.stringify({ 
          success: false, 
          error: conceptError.message 
        }), { 
          status: 500, 
          headers: { ...corsHeaders, "Content-Type": "application/json" } 
        });
      }

      return new Response(JSON.stringify({ 
        success: true, 
        message: "Concept added successfully", 
        data: conceptData 
      }), { 
        headers: { ...corsHeaders, "Content-Type": "application/json" } 
      });
    } 
    else if (type === "source") {
      const { 
        title, 
        author, 
        year, 
        type: sourceType = "book", 
        description, 
        content_summary = null, 
        keywords = [],
        full_content = null 
      } = content;

      // Validate required fields for source
      if (!title || !author || !year || !description) {
        return new Response(JSON.stringify({ 
          success: false, 
          error: "Title, author, year, and description are required for sources" 
        }), { 
          status: 400, 
          headers: { ...corsHeaders, "Content-Type": "application/json" } 
        });
      }

      // Insert the source into the database
      const { data: sourceData, error: sourceError } = await supabase
        .from('therapy_sources')
        .insert({
          title,
          author,
          year,
          type: sourceType,
          description,
          content_summary,
          keywords,
          full_content
        })
        .select('id, title')
        .single();

      if (sourceError) {
        console.error("Error inserting source:", sourceError);
        return new Response(JSON.stringify({ 
          success: false, 
          error: sourceError.message 
        }), { 
          status: 500, 
          headers: { ...corsHeaders, "Content-Type": "application/json" } 
        });
      }

      return new Response(JSON.stringify({ 
        success: true, 
        message: "Source added successfully", 
        data: sourceData 
      }), { 
        headers: { ...corsHeaders, "Content-Type": "application/json" } 
      });
    }
    
    else {
      return new Response(JSON.stringify({ 
        success: false, 
        error: `Invalid type: ${type}. Supported types are 'concept' and 'source'` 
      }), { 
        status: 400, 
        headers: { ...corsHeaders, "Content-Type": "application/json" } 
      });
    }

  } catch (error) {
    console.error("Error processing request:", error);
    return new Response(JSON.stringify({ 
      success: false, 
      error: error.message 
    }), { 
      status: 500, 
      headers: { ...corsHeaders, "Content-Type": "application/json" } 
    });
  }
});
