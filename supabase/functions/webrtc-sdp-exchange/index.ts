
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

    console.log(`[webrtc-sdp-exchange] Processing SDP exchange request for model: ${model}`);
    
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
      return new Response(
        JSON.stringify({ 
          error: `OpenAI SDP exchange failed: ${sdpResponse.status} ${sdpResponse.statusText}`, 
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
