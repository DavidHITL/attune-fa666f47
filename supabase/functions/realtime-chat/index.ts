
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import "https://deno.land/x/xhr@0.1.0/mod.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  // Handle WebSocket upgrades
  const upgradeHeader = req.headers.get("upgrade") || "";
  if (upgradeHeader.toLowerCase() === "websocket") {
    try {
      console.log("Processing WebSocket upgrade request for OpenAI Realtime API");
      const { socket, response } = Deno.upgradeWebSocket(req);
      const OPENAI_API_KEY = Deno.env.get("OPENAI_API_KEY");
      
      if (!OPENAI_API_KEY) {
        console.error("Missing OPENAI_API_KEY environment variable");
        socket.close(1011, "API key not configured");
        return response;
      }

      console.log("WebSocket connection established with client");
      
      let openAISocket: WebSocket | null = null;
      let connectionAttempts = 0;
      const maxConnectionAttempts = 3;
      let reconnectTimeout: number | undefined;
      
      // Function to connect to OpenAI with retry logic
      const connectToOpenAI = () => {
        try {
          if (openAISocket) {
            try {
              openAISocket.close();
            } catch (err) {
              console.warn("Error closing existing OpenAI WebSocket:", err);
            }
          }
          
          // Connect to the correct OpenAI Realtime API endpoint
          console.log("Connecting to OpenAI Realtime API with model: gpt-4o-realtime-preview");
          openAISocket = new WebSocket("wss://api.openai.com/v1/realtime?model=gpt-4o-realtime-preview-2024-10-01");
          
          openAISocket.onopen = () => {
            console.log("Connected to OpenAI Realtime API");
            
            // Send authentication message 
            openAISocket!.send(JSON.stringify({
              type: "auth",
              authorization: `Bearer ${OPENAI_API_KEY}`
            }));
            
            // Notify client that session was created
            socket.send(JSON.stringify({ type: "session.created" }));
            connectionAttempts = 0; // Reset connection attempts on successful connection
          };
          
          openAISocket.onerror = (event) => {
            console.error("OpenAI WebSocket error:", event);
            socket.send(JSON.stringify({ 
              type: "error", 
              error: "Connection error with OpenAI Realtime API" 
            }));
            
            if (connectionAttempts < maxConnectionAttempts) {
              connectionAttempts++;
              const backoffTime = 1000 * Math.pow(2, connectionAttempts);
              console.log(`Retrying OpenAI connection in ${backoffTime/1000}s, attempt ${connectionAttempts} of ${maxConnectionAttempts}`);
              reconnectTimeout = setTimeout(connectToOpenAI, backoffTime);
            } else {
              socket.send(JSON.stringify({ 
                type: "error", 
                error: "Failed to connect to OpenAI API after multiple attempts" 
              }));
            }
          };
          
          // Forward messages from OpenAI to client
          openAISocket.onmessage = (event) => {
            try {
              if (socket.readyState === socket.OPEN) {
                // Log the event type for debugging
                try {
                  const data = JSON.parse(event.data);
                  console.log("Received from OpenAI:", data.type || "unknown type");
                } catch (e) {
                  // If it's not JSON or has no type, just continue
                }
                
                socket.send(event.data);
              } else {
                console.warn("Client socket not open, can't forward OpenAI message");
              }
            } catch (error) {
              console.error("Error forwarding OpenAI message:", error);
            }
          };
          
          openAISocket.onclose = (event) => {
            console.log("OpenAI disconnected, code:", event.code, "reason:", event.reason);
            
            // Only attempt reconnection for unexpected closures
            if (event.code !== 1000 && connectionAttempts < maxConnectionAttempts) {
              connectionAttempts++;
              const backoffTime = 1000 * Math.pow(2, connectionAttempts);
              console.log(`Attempting to reconnect to OpenAI in ${backoffTime/1000}s, attempt ${connectionAttempts} of ${maxConnectionAttempts}`);
              reconnectTimeout = setTimeout(connectToOpenAI, backoffTime);
              
              // Notify client of reconnection attempt
              socket.send(JSON.stringify({ 
                type: "warning", 
                message: `Connection lost, attempting to reconnect (${connectionAttempts}/${maxConnectionAttempts})...` 
              }));
            } else if (event.code !== 1000) {
              socket.send(JSON.stringify({ 
                type: "error", 
                error: `OpenAI connection lost (code: ${event.code})` 
              }));
            }
          };
          
        } catch (error) {
          console.error("Error connecting to OpenAI:", error);
          socket.send(JSON.stringify({ 
            type: "error", 
            error: "Failed to connect to OpenAI: " + (error instanceof Error ? error.message : String(error)) 
          }));
        }
      };
      
      // Initial connection
      connectToOpenAI();
      
      // Forward messages from client to OpenAI
      socket.onmessage = (event) => {
        try {
          console.log("Message from client received");
          
          // Try to parse the message to see what type it is
          try {
            const data = JSON.parse(event.data);
            console.log("Client sending:", data.type || "unknown type");
          } catch (e) {
            // If it's not JSON, just continue
          }
          
          if (openAISocket && openAISocket.readyState === WebSocket.OPEN) {
            console.log("Forwarding message to OpenAI Realtime API");
            openAISocket.send(event.data);
          } else {
            console.warn("OpenAI socket not ready, attempting reconnection");
            // Attempt reconnection if socket isn't ready
            if (connectionAttempts < maxConnectionAttempts) {
              if (!reconnectTimeout) {
                connectToOpenAI();
              }
              
              // Queue message (simple implementation - just notify client)
              socket.send(JSON.stringify({ 
                type: "warning", 
                message: "Message queued, connecting to service..." 
              }));
            } else {
              socket.send(JSON.stringify({ 
                type: "error", 
                error: "Cannot send message: service unavailable" 
              }));
            }
          }
        } catch (error) {
          console.error("Error forwarding client message:", error);
          socket.send(JSON.stringify({ 
            type: "error", 
            error: "Failed to process message: " + (error instanceof Error ? error.message : String(error))
          }));
        }
      };
      
      // Handle socket closures
      socket.onclose = () => {
        console.log("Client disconnected");
        // Clear any pending reconnect timeouts
        if (reconnectTimeout) {
          clearTimeout(reconnectTimeout);
        }
        
        if (openAISocket) {
          openAISocket.close();
          openAISocket = null;
        }
      };
      
      socket.onerror = (error) => {
        console.error("Client WebSocket error:", error);
      };
      
      return response;
    } catch (error) {
      console.error("WebSocket error:", error);
      return new Response(JSON.stringify({ error: error instanceof Error ? error.message : String(error) }), { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      });
    }
  }

  // Fall back to HTTP request handling
  try {
    const OPENAI_API_KEY = Deno.env.get('OPENAI_API_KEY');
    
    if (!OPENAI_API_KEY) {
      throw new Error('API key not configured');
    }
    
    // Create a session with OpenAI
    console.log("Creating a new OpenAI Realtime session");
    const response = await fetch("https://api.openai.com/v1/realtime/sessions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${OPENAI_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gpt-4o-realtime-preview-2024-10-01",
        voice: "alloy",
        instructions: "You are a helpful AI assistant that speaks naturally with users. Keep responses concise and conversational. You're here to help with any questions or tasks."
      }),
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error("OpenAI API error:", errorText);
      throw new Error(`OpenAI API returned status ${response.status}: ${errorText}`);
    }
    
    const data = await response.json();
    console.log("Session created:", data);
    
    return new Response(JSON.stringify(data), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error("Error:", error);
    return new Response(JSON.stringify({ 
      error: error instanceof Error ? error.message : String(error),
      details: "There was an error processing your request. Please check if the OpenAI API key is configured correctly and the service is available."
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
