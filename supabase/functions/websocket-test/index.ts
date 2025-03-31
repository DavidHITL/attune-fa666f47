
// Simplified WebSocket echo server with enhanced error handling
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import "https://deno.land/x/xhr@0.1.0/mod.ts";

// CORS headers
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, sec-websocket-protocol, upgrade',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS'
};

serve(async (req) => {
  // Log request info
  console.log(`[WebSocket Test] Request: ${req.method} ${req.url}`);
  
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    console.log("[WebSocket Test] Handling OPTIONS preflight request");
    return new Response(null, {
      status: 204,
      headers: corsHeaders
    });
  }
  
  // Basic health check endpoint for HTTP GET
  if (req.method === "GET" && !req.headers.get("upgrade")) {
    console.log("[WebSocket Test] Handling HTTP GET request");
    return new Response(JSON.stringify({ 
      status: "ok", 
      message: "WebSocket test endpoint is running" 
    }), { 
      status: 200, 
      headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
    });
  }
  
  // Check for WebSocket upgrade request
  const upgradeHeader = req.headers.get("upgrade") || "";
  if (upgradeHeader.toLowerCase() !== "websocket") {
    console.log("[WebSocket Test] Not a WebSocket upgrade request");
    return new Response("Expected WebSocket upgrade", { 
      status: 400, 
      headers: { ...corsHeaders, 'Content-Type': 'text/plain' } 
    });
  }

  try {
    console.log("[WebSocket Test] Attempting WebSocket upgrade");
    
    // Log all request headers for debugging
    for (const [key, value] of req.headers.entries()) {
      console.log(`[WebSocket Test] Header: ${key}: ${value}`);
    }
    
    // Simple WebSocket upgrade with basic configuration
    const { socket, response } = Deno.upgradeWebSocket(req, {
      idleTimeout: 60000, // 60 second timeout
    });

    // WebSocket event handlers
    socket.onopen = () => {
      console.log("[WebSocket Test] Connection opened");
      try {
        socket.send(JSON.stringify({ 
          type: "connected", 
          message: "WebSocket connection established" 
        }));
      } catch (e) {
        console.error("[WebSocket Test] Error sending connected message:", e);
      }
    };

    socket.onmessage = (event) => {
      console.log(`[WebSocket Test] Received: ${event.data}`);
      try {
        // Echo the message back
        socket.send(`Echo: ${event.data}`);
      } catch (e) {
        console.error("[WebSocket Test] Error sending echo:", e);
      }
    };

    socket.onerror = (event) => {
      console.error("[WebSocket Test] WebSocket error:", event);
    };

    socket.onclose = (event) => {
      console.log(`[WebSocket Test] Connection closed. Code: ${event.code}, Reason: ${event.reason || "No reason"}, Clean: ${event.wasClean}`);
    };

    console.log("[WebSocket Test] Upgrade successful, returning response");
    return response;
  } catch (error) {
    console.error("[WebSocket Test] Error upgrading to WebSocket:", error);
    
    // Return detailed error for debugging
    return new Response(JSON.stringify({ 
      error: "WebSocket upgrade failed", 
      message: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined
    }), { 
      status: 500, 
      headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
    });
  }
});
