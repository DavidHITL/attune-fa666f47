import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import "https://deno.land/x/xhr@0.1.0/mod.ts";

// Define CORS headers specifically for WebSockets
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, sec-websocket-protocol, upgrade',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
};

serve(async (req) => {
  console.log(`Received ${req.method} request to ${req.url}`);
  
  // Log request headers for debugging
  console.log("Request headers:", Object.fromEntries(req.headers.entries()));
  
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    console.log("Responding to CORS preflight request");
    return new Response(null, { headers: corsHeaders });
  }

  // Handle WebSocket upgrade requests
  const upgradeHeader = req.headers.get("upgrade") || "";
  if (upgradeHeader.toLowerCase() === "websocket") {
    return handleWebSocketConnection(req);
  }

  // Handle regular HTTP requests (for testing/health checks)
  return new Response(
    JSON.stringify({ 
      status: "ok", 
      message: "Realtime endpoint operational",
      timestamp: new Date().toISOString(),
    }), 
    {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    }
  );
});

/**
 * Handle WebSocket connections and relay to OpenAI
 */
async function handleWebSocketConnection(req: Request): Promise<Response> {
  try {
    console.log("WebSocket upgrade request received");
    
    // Extract protocol information
    const protocolHeader = req.headers.get("sec-websocket-protocol");
    const protocols = protocolHeader ? protocolHeader.split(",").map(p => p.trim()) : undefined;
    console.log("Requested WebSocket protocols:", protocols || "none");
    
    // Perform WebSocket upgrade
    let upgradeResult;
    try {
      upgradeResult = Deno.upgradeWebSocket(req, {
        protocol: protocols && protocols.length > 0 ? protocols[0] : undefined,
        idleTimeout: 60000, // 1 minute timeout
      });
      
      console.log("WebSocket upgrade successful, selected protocol:", 
                  upgradeResult.socket.protocol || "none");
    } catch (upgradeError) {
      console.error("WebSocket upgrade failed:", upgradeError);
      console.error("Error details:", JSON.stringify({
        message: upgradeError.message,
        name: upgradeError.name,
      }));
      
      return new Response(JSON.stringify({ 
        error: "WebSocket upgrade failed", 
        message: upgradeError instanceof Error ? upgradeError.message : String(upgradeError),
        timestamp: new Date().toISOString()
      }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    
    const { socket, response } = upgradeResult;
    
    // Configure socket event handlers
    socket.onopen = () => {
      console.log("Client WebSocket connection opened");
      
      try {
        // Send immediate confirmation to client
        socket.send(JSON.stringify({ 
          type: "connection.established", 
          protocol: socket.protocol || "none",
          timestamp: new Date().toISOString() 
        }));
      } catch (error) {
        console.error("Error sending connection confirmation:", error);
      }
      
      // Connect to OpenAI
      connectToOpenAI(socket);
    };
    
    socket.onclose = (event) => {
      console.log(`Client WebSocket closed: code=${event.code}, reason=${event.reason || "none"}, clean=${event.wasClean}`);
    };
    
    socket.onerror = (event) => {
      console.error("Client WebSocket error:", event);
    };
    
    // Return upgrade response immediately
    return response;
  } catch (error) {
    console.error("Error in WebSocket handler:", error);
    return new Response(JSON.stringify({ 
      error: "Internal server error",
      message: error instanceof Error ? error.message : String(error),
      timestamp: new Date().toISOString()
    }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
}

/**
 * Connect to OpenAI's API and set up two-way communication
 */
function connectToOpenAI(clientSocket: WebSocket): void {
  try {
    const apiKey = Deno.env.get("OPENAI_API_KEY");
    if (!apiKey) {
      console.error("OPENAI_API_KEY environment variable not set");
      clientSocket.send(JSON.stringify({
        type: "error",
        error: "API key not configured",
        timestamp: new Date().toISOString()
      }));
      return;
    }
    
    console.log("Connecting to OpenAI Realtime API");
    
    // Connect to OpenAI's API
    const openaiSocket = new WebSocket("wss://api.openai.com/v1/realtime?model=gpt-4o-realtime-preview-2024-10-01");
    
    openaiSocket.onopen = () => {
      console.log("Connected to OpenAI API");
      
      // Authenticate with OpenAI
      openaiSocket.send(JSON.stringify({
        type: "auth",
        authorization: `Bearer ${apiKey}`
      }));
      
      // Inform client that we're connected to OpenAI
      clientSocket.send(JSON.stringify({
        type: "openai.connected",
        timestamp: new Date().toISOString()
      }));
      
      // Set up message forwarding from client to OpenAI
      clientSocket.onmessage = (event) => {
        if (openaiSocket.readyState === WebSocket.OPEN) {
          try {
            console.log("Forwarding message to OpenAI");
            openaiSocket.send(event.data);
          } catch (error) {
            console.error("Error forwarding message to OpenAI:", error);
            clientSocket.send(JSON.stringify({
              type: "error",
              error: "Failed to forward message",
              details: error instanceof Error ? error.message : String(error),
              timestamp: new Date().toISOString()
            }));
          }
        }
      };
    };
    
    // Forward messages from OpenAI to client
    openaiSocket.onmessage = (event) => {
      if (clientSocket.readyState === WebSocket.OPEN) {
        try {
          // Log message type for debugging
          try {
            const data = JSON.parse(event.data);
            console.log("Received from OpenAI:", data.type || "unknown type");
          } catch (e) {
            // Not JSON or no type field, continue
          }
          
          clientSocket.send(event.data);
        } catch (error) {
          console.error("Error forwarding OpenAI message to client:", error);
        }
      }
    };
    
    // Handle OpenAI connection errors
    openaiSocket.onerror = (event) => {
      console.error("OpenAI WebSocket error:", event);
      
      if (clientSocket.readyState === WebSocket.OPEN) {
        clientSocket.send(JSON.stringify({
          type: "error",
          error: "OpenAI connection error",
          timestamp: new Date().toISOString()
        }));
      }
    };
    
    // Handle OpenAI connection close
    openaiSocket.onclose = (event) => {
      console.log(`OpenAI WebSocket closed: code=${event.code}, reason=${event.reason || "none"}, clean=${event.wasClean}`);
      
      if (clientSocket.readyState === WebSocket.OPEN) {
        clientSocket.send(JSON.stringify({
          type: "openai.disconnected",
          code: event.code,
          reason: event.reason || "Connection closed",
          timestamp: new Date().toISOString()
        }));
      }
    };
    
    // Handle client socket closing - clean up OpenAI connection
    const originalOnClose = clientSocket.onclose;
    clientSocket.onclose = (event) => {
      console.log("Client disconnected, closing OpenAI connection");
      
      if (openaiSocket.readyState === WebSocket.OPEN || 
          openaiSocket.readyState === WebSocket.CONNECTING) {
        openaiSocket.close();
      }
      
      if (originalOnClose) {
        originalOnClose.call(clientSocket, event);
      }
    };
    
    // Set up ping interval to keep connection alive
    const pingInterval = setInterval(() => {
      if (openaiSocket.readyState === WebSocket.OPEN && 
          clientSocket.readyState === WebSocket.OPEN) {
        try {
          openaiSocket.send(JSON.stringify({ type: "ping" }));
        } catch (error) {
          console.error("Error sending ping:", error);
          clearInterval(pingInterval);
        }
      } else {
        console.log("Clearing ping interval, connection closed");
        clearInterval(pingInterval);
      }
    }, 30000); // 30 second ping
    
  } catch (error) {
    console.error("Error setting up OpenAI connection:", error);
    
    if (clientSocket.readyState === WebSocket.OPEN) {
      clientSocket.send(JSON.stringify({
        type: "error",
        error: "Failed to connect to OpenAI",
        details: error instanceof Error ? error.message : String(error),
        timestamp: new Date().toISOString()
      }));
    }
  }
}
