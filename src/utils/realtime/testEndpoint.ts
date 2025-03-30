import { testRealtimeFunctionEndpoint } from './testRealtimeFunctionEndpoint';

/**
 * Test the HTTP endpoint
 */
export async function testRealtimeFunctionEndpoint(): Promise<{ success: boolean; message: string }> {
  try {
    const response = await fetch('/api/test-realtime-endpoint');
    const data = await response.json();
    
    if (response.ok) {
      return { success: true, message: `Endpoint test successful: ${data.message}` };
    } else {
      return { success: false, message: `Endpoint test failed: ${data.error}` };
    }
  } catch (error) {
    console.error("Error testing endpoint:", error);
    return { success: false, message: `Error testing endpoint: ${error}` };
  }
}

/**
 * Test the WebSocket connection
 */
export function testWebSocketConnection(): { success: boolean; message: string; close: () => void } {
  try {
    const projectId = 'oseowhythgbqvllwonaz';
    const wsUrl = `wss://${projectId}.supabase.co/functions/v1/realtime-chat`;
    
    console.log("Connecting to WebSocket:", wsUrl);
    const socket = new WebSocket(wsUrl);
    
    socket.onopen = () => {
      console.log("WebSocket connection established");
    };
    
    socket.onmessage = (event) => {
      console.log("Received message:", event.data);
    };
    
    socket.onerror = (error) => {
      console.error("WebSocket error:", error);
    };
    
    socket.onclose = (event) => {
      console.log("WebSocket closed. Code:", event.code, "Reason:", event.reason);
    };
    
    return {
      success: true,
      message: "WebSocket connection attempt started. Check console for connection status.",
      close: () => {
        console.log("Closing WebSocket connection");
        socket.close();
      }
    };
  } catch (error) {
    console.error("Error testing WebSocket connection:", error);
    return {
      success: false,
      message: `Test failed: ${error instanceof Error ? error.message : String(error)}`,
      close: () => {}
    };
  }
}

/**
 * Test the WebSocket connection with session establishment and audio flow
 */
export function testCompleteChatFlow(): { success: boolean; message: string; close: () => void } {
  try {
    console.log("Starting complete chat flow test...");
    
    // Create WebSocket connection
    const projectId = 'oseowhythgbqvllwonaz';
    const wsUrl = `wss://${projectId}.supabase.co/functions/v1/realtime-chat`;
    
    console.log("Connecting to WebSocket:", wsUrl);
    const socket = new WebSocket(wsUrl);
    
    let sessionId: string | null = null;
    let sessionEstablished = false;
    
    socket.onopen = () => {
      console.log("WebSocket connection established");
    };
    
    socket.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        console.log("Received message:", data.type);
        
        if (data.type === "connection.established") {
          console.log("Connection confirmed by server");
        } 
        else if (data.type === "session.created") {
          console.log("Session created successfully", data);
          sessionId = data.session?.id || "unknown-session";
          
          // Send session configuration
          const sessionConfig = {
            "event_id": `event_${Date.now()}`,
            "type": "session.update",
            "session": {
              "modalities": ["text", "audio"],
              "voice": "alloy",
              "input_audio_format": "pcm16",
              "output_audio_format": "pcm16"
            }   
          };
          
          console.log("Sending session configuration");
          socket.send(JSON.stringify(sessionConfig));
        }
        else if (data.type === "session.updated") {
          console.log("Session configuration updated successfully");
          sessionEstablished = true;
          
          // Send a test message
          setTimeout(() => {
            if (socket.readyState === WebSocket.OPEN) {
              console.log("Sending test message");
              const testMessage = {
                type: 'conversation.item.create',
                item: {
                  type: 'message',
                  role: 'user',
                  content: [
                    {
                      type: 'input_text',
                      text: 'Hello, this is a test message'
                    }
                  ]
                }
              };
              
              socket.send(JSON.stringify(testMessage));
              socket.send(JSON.stringify({type: 'response.create'}));
            }
          }, 1000);
        }
        else if (data.type === "response.audio.delta" || data.type === "response.audio_transcript.delta") {
          console.log("Received response data");
        }
      } catch (error) {
        console.error("Error parsing WebSocket message:", error);
      }
    };
    
    socket.onerror = (error) => {
      console.error("WebSocket error:", error);
    };
    
    socket.onclose = (event) => {
      console.log("WebSocket closed. Code:", event.code, "Reason:", event.reason);
    };
    
    // Return control object
    return {
      success: true,
      message: "Started complete chat flow test. Check console for progress.",
      close: () => {
        console.log("Closing test connection");
        socket.close();
      }
    };
  } catch (error) {
    console.error("Error testing complete chat flow:", error);
    return {
      success: false,
      message: `Test failed: ${error instanceof Error ? error.message : String(error)}`,
      close: () => {} // No-op since connection failed
    };
  }
}
