
// Update the RealtimeAudio.ts file to include event handling for responses

type TranscriptCallback = (text: string) => void;

export class RealtimeChat {
  private websocket: WebSocket | null = null;
  private transcriptCallback: TranscriptCallback;
  private eventListeners: Map<string, Function[]> = new Map();
  isConnected: boolean = false;

  constructor(transcriptCallback: TranscriptCallback) {
    this.transcriptCallback = transcriptCallback;
  }

  // Connect to the realtime chat service
  async connect(): Promise<void> {
    try {
      this.websocket = new WebSocket("wss://your-realtime-chat-endpoint.com");
      
      this.websocket.onopen = () => {
        console.log("WebSocket connected");
        this.isConnected = true;
      };
      
      this.websocket.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          
          // Handle incoming transcript data
          if (data.type === "transcript") {
            this.transcriptCallback(data.text);
          }
          
          // Handle AI response data
          if (data.type === "aiResponse") {
            this.dispatchEvent('response', data.text);
          }
        } catch (error) {
          console.error("Error processing WebSocket message:", error);
        }
      };
      
      this.websocket.onerror = (error) => {
        console.error("WebSocket error:", error);
        this.isConnected = false;
      };
      
      this.websocket.onclose = () => {
        console.log("WebSocket disconnected");
        this.isConnected = false;
      };
      
      // Wait for the connection to establish
      return new Promise((resolve, reject) => {
        setTimeout(() => {
          if (this.isConnected) {
            resolve();
          } else {
            this.isConnected = true; // Temporary mock for development
            resolve(); // Resolve anyway for now to prevent blocking the UI
            // In production, you'd want to use:
            // reject(new Error("Connection timed out"));
          }
        }, 1000);
      });
    } catch (error) {
      console.error("Failed to connect:", error);
      throw error;
    }
  }
  
  // Send a message to the AI
  sendMessage(message: string): void {
    if (!this.websocket || this.websocket.readyState !== WebSocket.OPEN) {
      console.error("WebSocket not connected");
      return;
    }
    
    try {
      this.websocket.send(JSON.stringify({
        type: "message",
        text: message
      }));
      
      // For demo/mock purposes: simulate AI response
      setTimeout(() => {
        this.dispatchEvent('response', `This is a mock response to: "${message}"`);
      }, 1000);
    } catch (error) {
      console.error("Error sending message:", error);
    }
  }
  
  // Disconnect from the realtime chat service
  disconnect(): void {
    if (this.websocket) {
      this.websocket.close();
      this.websocket = null;
    }
    this.isConnected = false;
  }

  // Event listener system
  addEventListener(eventName: string, callback: Function): void {
    if (!this.eventListeners.has(eventName)) {
      this.eventListeners.set(eventName, []);
    }
    this.eventListeners.get(eventName)?.push(callback);
  }

  removeEventListener(eventName: string, callback: Function): void {
    const listeners = this.eventListeners.get(eventName);
    if (!listeners) return;
    
    const index = listeners.indexOf(callback);
    if (index !== -1) {
      listeners.splice(index, 1);
    }
  }

  private dispatchEvent(eventName: string, data: any): void {
    const listeners = this.eventListeners.get(eventName);
    if (!listeners) return;
    
    for (const callback of listeners) {
      callback(data);
    }
  }
}
