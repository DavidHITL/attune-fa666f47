
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { corsHeaders } from "../_shared/cors.ts";

/**
 * Edge Function that proxies WebRTC SDP exchange requests to OpenAI
 * This bypasses CORS restrictions from browser to OpenAI
 */
serve(async (req: Request) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Extract parameters from request
    const { sdp, apiKey, model } = await req.json();
    
    if (!sdp || !apiKey || !model) {
      console.error("[webrtc-sdp-exchange] Missing required parameters");
      return new Response(
        JSON.stringify({ error: "Missing required parameters" }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Validate API key
    if (apiKey.trim() === "" || apiKey.length < 20) {
      console.error("[webrtc-sdp-exchange] Invalid API key format");
      return new Response(
        JSON.stringify({ error: "Invalid API key format" }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`[webrtc-sdp-exchange] Processing SDP exchange request for model: ${model}`);
    console.log(`[webrtc-sdp-exchange] Using API key: ${apiKey.substring(0, 5)}..., length: ${apiKey.length}`);
    
    // Forward the SDP offer to OpenAI
    const modelParam = encodeURIComponent(model);
    const requestUrl = `https://api.openai.com/v1/realtime?model=${modelParam}`;
    
    console.log(`[webrtc-sdp-exchange] Forwarding request to: ${requestUrl}`);
    console.time("[webrtc-sdp-exchange] OpenAI SDP Request Time");
    
    const sdpResponse = await fetch(requestUrl, {
      method: "POST",
      body: sdp,
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/sdp"
      }
    });
    
    console.timeEnd("[webrtc-sdp-exchange] OpenAI SDP Request Time");
    console.log(`[webrtc-sdp-exchange] OpenAI responded with status: ${sdpResponse.status}`);

    // Check for errors
    if (!sdpResponse.ok) {
      const errorText = await sdpResponse.text();
      console.error(`[webrtc-sdp-exchange] OpenAI error (${sdpResponse.status}):`, errorText);
      
      // Provide more specific error messages for common error types
      let errorMessage = `OpenAI SDP exchange failed: ${sdpResponse.status} ${sdpResponse.statusText}`;
      
      if (sdpResponse.status === 401 || sdpResponse.status === 403 || errorText.includes("auth")) {
        errorMessage = "Authentication failed with OpenAI. The ephemeral token may have expired.";
      } else if (sdpResponse.status === 429) {
        errorMessage = "OpenAI API rate limit exceeded. Please try again later.";
      } else if (sdpResponse.status >= 500) {
        errorMessage = "OpenAI API service error. Please try again later.";
      }
      
      return new Response(
        JSON.stringify({ 
          error: errorMessage, 
          details: errorText 
        }),
        { 
          status: sdpResponse.status, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Get the SDP answer from OpenAI
    const sdpAnswer = await sdpResponse.text();
    
    if (!sdpAnswer || sdpAnswer.trim() === "") {
      console.error("[webrtc-sdp-exchange] Empty SDP answer received");
      return new Response(
        JSON.stringify({ error: "Empty SDP answer received from OpenAI" }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    // Log a preview of the SDP answer (first and last 50 characters)
    const sdpPreview = sdpAnswer.length > 100 
      ? `${sdpAnswer.substring(0, 50)}...${sdpAnswer.substring(sdpAnswer.length - 50)}`
      : sdpAnswer;
    console.log(`[webrtc-sdp-exchange] SDP answer preview: ${sdpPreview}`);
    
    // Return the SDP answer to the client
    console.log("[webrtc-sdp-exchange] Successfully forwarded SDP answer");
    return new Response(
      sdpAnswer,
      { 
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/sdp' 
        } 
      }
    );
  } catch (error) {
    console.error("[webrtc-sdp-exchange] Error:", error);
    return new Response(
      JSON.stringify({ 
        error: "Failed to process SDP exchange", 
        message: error instanceof Error ? error.message : String(error) 
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});
