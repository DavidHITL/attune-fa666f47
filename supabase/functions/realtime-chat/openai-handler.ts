
import { OpenAISocketOptions, ConnectionHandlerOptions } from "./types.ts";

/**
 * Connect to OpenAI's Realtime API with retry logic
 */
export function connectToOpenAI(options: ConnectionHandlerOptions & { apiKey: string }): void {
  const { 
    socket, 
    apiKey,
    openAISocketRef,
    reconnectTimeoutRef,
    connectionAttemptsRef,
    maxConnectionAttempts
  } = options;
  
  try {
    if (openAISocketRef.current) {
      try {
        openAISocketRef.current.close();
      } catch (err) {
        console.warn("Error closing existing OpenAI WebSocket:", err);
      }
    }
    
    // Connect to the correct OpenAI Realtime API endpoint with gpt-4o
    console.log("Connecting to OpenAI Realtime API with model: gpt-4o-realtime-preview-2024-10-01");
    openAISocketRef.current = new WebSocket("wss://api.openai.com/v1/realtime?model=gpt-4o-realtime-preview-2024-10-01");
    
    setupOpenAISocketHandlers({
      socket,
      apiKey,
      openAISocket: openAISocketRef.current,
      reconnectTimeoutRef,
      connectionAttemptsRef,
      maxConnectionAttempts,
      retryConnect: () => connectToOpenAI(options),
    });
  } catch (error) {
    console.error("Error connecting to OpenAI:", error);
    socket.send(JSON.stringify({ 
      type: "error", 
      error: "Failed to connect to OpenAI: " + (error instanceof Error ? error.message : String(error)) 
    }));
  }
}

/**
 * Set up event handlers for the OpenAI WebSocket connection
 */
export function setupOpenAISocketHandlers(options: OpenAISocketOptions): void {
  const { 
    socket, 
    apiKey,
    openAISocket,
    reconnectTimeoutRef,
    connectionAttemptsRef,
    maxConnectionAttempts,
    retryConnect
  } = options;
  
  // Handle OpenAI connection established
  openAISocket.onopen = () => {
    console.log("Connected to OpenAI Realtime API");
    
    // Send authentication message 
    openAISocket.send(JSON.stringify({
      type: "auth",
      authorization: `Bearer ${apiKey}`
    }));
    
    // Notify client that session was created
    socket.send(JSON.stringify({ type: "session.created" }));
    connectionAttemptsRef.current = 0; // Reset connection attempts on successful connection
  };
  
  // Handle OpenAI connection errors
  openAISocket.onerror = (event) => {
    console.error("OpenAI WebSocket error:", event);
    socket.send(JSON.stringify({ 
      type: "error", 
      error: "Connection error with OpenAI Realtime API" 
    }));
    
    handleReconnection(options);
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
  
  // Handle OpenAI connection closure
  openAISocket.onclose = (event) => {
    console.log("OpenAI disconnected, code:", event.code, "reason:", event.reason);
    
    // Only attempt reconnection for unexpected closures
    if (event.code !== 1000) {
      handleReconnection(options);
      
      // Notify client if it's a resource issue
      if (event.code === 1006) {
        socket.send(JSON.stringify({ 
          type: "warning", 
          message: "Connection issue detected, attempting to reconnect..." 
        }));
      }
    }
  };

  // Handle forwarding messages from client to OpenAI
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
        if (connectionAttemptsRef.current < maxConnectionAttempts) {
          if (!reconnectTimeoutRef.current) {
            retryConnect();
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
}

/**
 * Handle reconnection attempts with exponential backoff
 */
export function handleReconnection(options: OpenAISocketOptions): void {
  const { 
    connectionAttemptsRef, 
    maxConnectionAttempts, 
    reconnectTimeoutRef,
    socket,
    retryConnect
  } = options;
  
  if (connectionAttemptsRef.current < maxConnectionAttempts) {
    connectionAttemptsRef.current++;
    const backoffTime = 1000 * Math.pow(2, connectionAttemptsRef.current);
    console.log(`Retrying OpenAI connection in ${backoffTime/1000}s, attempt ${connectionAttemptsRef.current} of ${maxConnectionAttempts}`);
    
    // Use proper type for setTimeout with Deno
    reconnectTimeoutRef.current = setTimeout(retryConnect, backoffTime);
    
    // Notify client of reconnection attempt
    socket.send(JSON.stringify({ 
      type: "warning", 
      message: `Connection lost, attempting to reconnect (${connectionAttemptsRef.current}/${maxConnectionAttempts})...` 
    }));
  } else {
    socket.send(JSON.stringify({ 
      type: "error", 
      error: "Failed to connect to OpenAI API after multiple attempts" 
    }));
  }
}
