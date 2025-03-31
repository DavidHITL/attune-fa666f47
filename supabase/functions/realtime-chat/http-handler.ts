
// HTTP handler for the realtime-chat edge function

import { corsHeaders } from "./utils.ts";

/**
 * Handle standard HTTP requests to the edge function
 */
export function handleHttpRequest(req: Request): Response {
  // Return API information
  return new Response(JSON.stringify({
    service: "OpenAI Realtime Chat Relay",
    status: "active",
    usage: "Connect via WebSocket to use this service",
    time: new Date().toISOString()
  }), {
    status: 200,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' }
  });
}
