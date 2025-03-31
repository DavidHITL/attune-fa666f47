
// Minimal WebSocket echo server test function
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import "https://deno.land/x/xhr@0.1.0/mod.ts";

// CORS headers for preflight requests
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, sec-websocket-protocol, upgrade',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS'
};

serve(async (req) => {
  console.log(`[WS-Test] Received ${req.method} request to ${req.url}`);
  
  // Log all headers for debugging
  const headerEntries = Array.from(req.headers.entries());
  console.log("[WS-Test] Request headers:", JSON.stringify(Object.fromEntries(headerEntries)));
  
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    console.log("[WS-Test] Handling OPTIONS preflight request");
    return new Response(null, {
      headers: {
        ...corsHeaders,
        "Access-Control-Max-Age": "86400",
      }
    });
  }
  
  // Check for WebSocket upgrade request
  const upgradeHeader = req.headers.get("upgrade") || "";
  if (upgradeHeader.toLowerCase() !== "websocket") {
    console.log("[WS-Test] Not a WebSocket upgrade request:", upgradeHeader);
    return new Response("Expected WebSocket upgrade", { 
      status: 400, 
      headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
    });
  }

  console.log("[WS-Test] Processing WebSocket upgrade request");
  
  try {
    // Instead of using the protocol header directly, extract it from headers
    const protocolHeader = req.headers.get("sec-websocket-protocol");
    const requestedProtocols = protocolHeader ? protocolHeader.split(",").map(p => p.trim()) : undefined;
    console.log("[WS-Test] Requested protocols:", requestedProtocols || "none");
    
    // First attempt to upgrade with no protocol option
    console.log("[WS-Test] Attempting simple WebSocket upgrade");
    const upgradeResult = Deno.upgradeWebSocket(req);
    console.log("[WS-Test] Upgrade successful");
    
    const { socket, response } = upgradeResult;
    
    // Set up socket event handlers with detailed logging
    socket.onopen = (event) => {
      console.log("[WS-Test] Socket opened:", event.type);
    };
    
    socket.onmessage = (event) => {
      console.log("[WS-Test] Received message:", event.data);
      // Echo the message back
      try {
        socket.send(`Echo: ${event.data}`);
        console.log("[WS-Test] Sent echo response");
      } catch (sendError) {
        console.error("[WS-Test] Error sending echo:", sendError);
      }
    };
    
    socket.onerror = (event) => {
      console.error("[WS-Test] Socket error:", event);
      if (event instanceof ErrorEvent) {
        console.error("[WS-Test] Error details:", event.message);
      }
    };
    
    socket.onclose = (event) => {
      console.log("[WS-Test] Socket closed. Code:", event.code, "Reason:", event.reason || "No reason provided", "Clean:", event.wasClean);
    };
    
    // Critical: Return response immediately without any delay
    console.log("[WS-Test] Returning 101 response immediately");
    return response;
  } catch (error) {
    console.error("[WS-Test] Error during upgrade:", error);
    console.error("[WS-Test] Error details:", JSON.stringify({
      name: error.name,
      message: error.message,
      stack: error.stack
    }, null, 2));
    
    // Try one more time with different options
    try {
      console.log("[WS-Test] Attempting fallback upgrade");
      // Simple upgrade without any options
      const fallbackResult = Deno.upgradeWebSocket(req, {
        idleTimeout: 60000, // Longer timeout
      });
      console.log("[WS-Test] Fallback upgrade successful");
      
      // Set up basic event handlers
      fallbackResult.socket.onmessage = (event) => {
        fallbackResult.socket.send(`Echo: ${event.data}`);
      };
      
      return fallbackResult.response;
    } catch (fallbackError) {
      console.error("[WS-Test] Fallback also failed:", fallbackError);
      
      return new Response(JSON.stringify({ 
        error: "WebSocket upgrade failed", 
        details: error instanceof Error ? error.message : String(error),
        fallbackError: fallbackError instanceof Error ? fallbackError.message : String(fallbackError)
      }), { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      });
    }
  }
});
