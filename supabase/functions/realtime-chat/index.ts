
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
      const { socket, response } = Deno.upgradeWebSocket(req);
      const OPENAI_API_KEY = Deno.env.get("OPENAI_API_KEY");
      
      if (!OPENAI_API_KEY) {
        socket.close(1011, "API key not configured");
        return response;
      }

      console.log("WebSocket connection established");
      
      // Connect to OpenAI Realtime API
      const openAISocket = new WebSocket("wss://api.openai.com/v1/realtime?model=gpt-4o-realtime-preview-2024-10-01");
      
      // Send authorization upon connection
      openAISocket.onopen = () => {
        console.log("Connected to OpenAI");
        openAISocket.send(JSON.stringify({
          type: "auth",
          authorization: `Bearer ${OPENAI_API_KEY}`
        }));
        socket.send(JSON.stringify({ type: "session.created" }));
      };
      
      // Forward messages from client to OpenAI
      socket.onmessage = (event) => {
        try {
          console.log("Message from client:", event.data);
          openAISocket.send(event.data);
        } catch (error) {
          console.error("Error forwarding client message:", error);
        }
      };
      
      // Forward messages from OpenAI to client
      openAISocket.onmessage = (event) => {
        try {
          socket.send(event.data);
        } catch (error) {
          console.error("Error forwarding OpenAI message:", error);
        }
      };
      
      // Handle socket closures
      socket.onclose = () => {
        console.log("Client disconnected");
        openAISocket.close();
      };
      
      openAISocket.onclose = () => {
        console.log("OpenAI disconnected");
        socket.close();
      };
      
      return response;
    } catch (error) {
      console.error("WebSocket error:", error);
      return new Response(JSON.stringify({ error: error.message }), { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      });
    }
  }

  // Handle regular HTTP requests for token generation
  try {
    const OPENAI_API_KEY = Deno.env.get("OPENAI_API_KEY");
    
    if (!OPENAI_API_KEY) {
      throw new Error('API key not configured');
    }
    
    // Create a session with OpenAI
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
    
    const data = await response.json();
    console.log("Session created:", data);
    
    return new Response(JSON.stringify(data), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error("Error:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
