import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { corsHeaders } from "../_shared/cors.ts";

serve(async (req) => {
  try {
    console.log(`Received ${req.method} request to ${req.url}`);
    
    // Handle CORS preflight requests
    if (req.method === "OPTIONS") {
      console.log("Responding to CORS preflight request with headers:", JSON.stringify(corsHeaders));
      return new Response(null, { headers: corsHeaders });
    }

    // Handle WebSocket upgrade requests
    const upgradeHeader = req.headers.get("upgrade") || "";
    if (upgradeHeader.toLowerCase() === "websocket") {
      return handleWebSocketUpgrade(req);
    }

    // Handle regular HTTP requests (for testing/health checks)
    return new Response(JSON.stringify({ status: "ok", message: "Realtime endpoint operational" }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Unhandled error in edge function:", error);
    return new Response(
      JSON.stringify({
        error: "Internal Server Error",
        message: error instanceof Error ? error.message : String(error),
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});

/**
 * Handle WebSocket upgrade and proxy communication to OpenAI
 */
async function handleWebSocketUpgrade(req: Request): Promise<Response> {
  try {
    console.log("Handling WebSocket upgrade request");
    
    // Log requested protocols for debugging
    const requestedProtocol = req.headers.get("sec-websocket-protocol");
    console.log("Requested WebSocket protocols:", requestedProtocol || "none");
    
    // Extract protocols (if any)
    const protocols = requestedProtocol?.split(",").map(p => p.trim()) || undefined;
    
    // Perform the WebSocket upgrade with the specified protocol
    const upgradeResult = Deno.upgradeWebSocket(req, {
      protocol: protocols && protocols.length > 0 ? protocols[0] : undefined,
      // Increase timeout for development/debugging
      idleTimeout: 120000, // 2 minutes
    });
    
    const { socket, response } = upgradeResult;
    console.log("WebSocket upgrade successful, protocol:", socket.protocol || "none");
    
    // Set up event handlers for the client WebSocket
    setupClientSocketHandlers(socket);
    
    // Connect to OpenAI and set up relay
    connectToOpenAI(socket, protocols).catch(error => {
      console.error("Error connecting to OpenAI:", error);
      if (socket.readyState === WebSocket.OPEN) {
        socket.send(JSON.stringify({
          type: "error",
          message: "Failed to connect to OpenAI",
          details: error instanceof Error ? error.message : String(error)
        }));
      }
    });
    
    // Return the upgrade response immediately
    return response;
  } catch (error) {
    console.error("WebSocket upgrade failed:", error);
    // Return an error response if the WebSocket upgrade fails
    return new Response(
      JSON.stringify({
        error: "WebSocket Upgrade Failed",
        message: error instanceof Error ? error.message : String(error),
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
}

/**
 * Set up event handlers for the client WebSocket
 */
function setupClientSocketHandlers(socket: WebSocket): void {
  // Set up initial handlers
  socket.onopen = () => {
    console.log("Client WebSocket connection opened");
    
    // Send immediate connection confirmation
    try {
      socket.send(JSON.stringify({
        type: "connection.established",
        timestamp: new Date().toISOString()
      }));
      console.log("Sent connection confirmation to client");
    } catch (error) {
      console.error("Failed to send connection confirmation:", error);
    }
  };

  socket.onerror = (event) => {
    console.error("Client WebSocket error:", event);
  };

  socket.onclose = (event) => {
    console.log(`Client WebSocket closed (Code: ${event.code}, Reason: ${event.reason || "No reason provided"}, Clean: ${event.wasClean})`);
  };
}

/**
 * Connect to OpenAI's Realtime API and set up bidirectional relay
 */
async function connectToOpenAI(clientSocket: WebSocket, protocols?: string[]): Promise<void> {
  // Verify we have an OpenAI API key
  const apiKey = Deno.env.get("OPENAI_API_KEY");
  if (!apiKey) {
    throw new Error("OPENAI_API_KEY environment variable not set");
  }
  
  try {
    // Connect to OpenAI's Realtime API
    console.log("Connecting to OpenAI Realtime API...");
    const openaiSocket = new WebSocket("wss://api.openai.com/v1/realtime?model=gpt-4o-realtime-preview-2024-10-01");
    
    // Set up event handlers for OpenAI WebSocket
    openaiSocket.onopen = () => {
      console.log("Connected to OpenAI Realtime API");
      
      // Send authentication message to OpenAI
      openaiSocket.send(JSON.stringify({
        type: "auth",
        authorization: `Bearer ${apiKey}`
      }));
      
      // Notify client that we're connected to OpenAI
      if (clientSocket.readyState === WebSocket.OPEN) {
        clientSocket.send(JSON.stringify({ type: "session.created" }));
      }
      
      // Set up relay from client to OpenAI
      setupClientToOpenAIRelay(clientSocket, openaiSocket);
    };
    
    // Forward messages from OpenAI to client
    openaiSocket.onmessage = (event) => {
      if (clientSocket.readyState === WebSocket.OPEN) {
        try {
          // Log the event type for debugging
          try {
            const data = JSON.parse(event.data);
            console.log("Received from OpenAI:", data.type || "unknown type");
          } catch (e) {
            // If it's not JSON or has no type, just continue
          }
          
          // Forward the message to the client
          clientSocket.send(event.data);
        } catch (error) {
          console.error("Error forwarding message from OpenAI to client:", error);
        }
      }
    };
    
    // Handle OpenAI connection errors
    openaiSocket.onerror = (event) => {
      console.error("OpenAI WebSocket error:", event);
      
      // Notify client of the error
      if (clientSocket.readyState === WebSocket.OPEN) {
        clientSocket.send(JSON.stringify({
          type: "error",
          error: "OpenAI connection error",
          timestamp: new Date().toISOString()
        }));
      }
    };
    
    // Handle OpenAI connection closure
    openaiSocket.onclose = (event) => {
      console.log(`OpenAI WebSocket closed (Code: ${event.code}, Reason: ${event.reason || "No reason provided"}, Clean: ${event.wasClean})`);
      
      // Notify client of the disconnection
      if (clientSocket.readyState === WebSocket.OPEN) {
        clientSocket.send(JSON.stringify({
          type: "disconnect",
          message: "OpenAI connection closed",
          code: event.code,
          reason: event.reason || "No reason provided",
          wasClean: event.wasClean,
          timestamp: new Date().toISOString()
        }));
      }
    };
    
    // Handle client disconnection
    clientSocket.onclose = (event) => {
      console.log(`Client WebSocket closed, closing OpenAI connection (Code: ${event.code}, Reason: ${event.reason || "No reason provided"})`);
      
      // Close the OpenAI connection when client disconnects
      if (openaiSocket.readyState === WebSocket.OPEN || openaiSocket.readyState === WebSocket.CONNECTING) {
        openaiSocket.close();
      }
    };
    
    // Set up keep-alive ping for the OpenAI connection
    const pingInterval = setInterval(() => {
      if (openaiSocket.readyState === WebSocket.OPEN && clientSocket.readyState === WebSocket.OPEN) {
        try {
          openaiSocket.send(JSON.stringify({ type: "ping" }));
          console.log("Sent ping to OpenAI");
        } catch (error) {
          console.error("Error sending ping to OpenAI:", error);
          clearInterval(pingInterval);
        }
      } else {
        console.log("Stopping OpenAI ping interval, connection is closed");
        clearInterval(pingInterval);
      }
    }, 30000); // 30 second ping
    
  } catch (error) {
    console.error("Error establishing connection to OpenAI:", error);
    throw error;
  }
}

/**
 * Set up relay of messages from client to OpenAI
 */
function setupClientToOpenAIRelay(clientSocket: WebSocket, openaiSocket: WebSocket): void {
  // Set up message forwarding from client to OpenAI
  clientSocket.onmessage = (event) => {
    try {
      // Log the message type for debugging (if it's JSON)
      try {
        const data = JSON.parse(event.data);
        console.log("Forwarding from client to OpenAI:", data.type || "unknown type");
      } catch (e) {
        // If it's not JSON, just continue
      }
      
      // Forward the message to OpenAI
      if (openaiSocket.readyState === WebSocket.OPEN) {
        openaiSocket.send(event.data);
      } else {
        console.warn("Cannot forward message: OpenAI socket not ready");
        
        // Notify client that the OpenAI connection is not ready
        if (clientSocket.readyState === WebSocket.OPEN) {
          clientSocket.send(JSON.stringify({
            type: "error",
            error: "OpenAI connection not ready",
            timestamp: new Date().toISOString()
          }));
        }
      }
    } catch (error) {
      console.error("Error forwarding message from client to OpenAI:", error);
      
      // Notify client of the error
      if (clientSocket.readyState === WebSocket.OPEN) {
        clientSocket.send(JSON.stringify({
          type: "error",
          error: "Failed to forward message to OpenAI",
          details: error instanceof Error ? error.message : String(error),
          timestamp: new Date().toISOString()
        }));
      }
    }
  };
}
