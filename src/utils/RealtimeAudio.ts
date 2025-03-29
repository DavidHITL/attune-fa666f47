
// Update the RealtimeAudio.ts file to include better audio handling

type TranscriptCallback = (text: string) => void;

export class RealtimeChat {
  private websocket: WebSocket | null = null;
  private transcriptCallback: TranscriptCallback;
  private eventListeners: Map<string, Function[]> = new Map();
  isConnected: boolean = false;
  private lastTranscriptUpdate: number = 0;
  private processingTimeout: NodeJS.Timeout | null = null;

  constructor(transcriptCallback: TranscriptCallback) {
    this.transcriptCallback = transcriptCallback;
  }

  // Connect to the realtime chat service
  async connect(): Promise<void> {
    try {
      // In a real implementation, this would connect to a real WebSocket endpoint
      console.log("Connecting to voice service...");
      
      // Mock connection - in a real implementation this would be a WebSocket connection
      this.isConnected = true;
      
      // Setup event listeners and handlers
      this.setupMockEventHandlers();
      
      return Promise.resolve();
    } catch (error) {
      console.error("Failed to connect:", error);
      this.isConnected = false;
      throw error;
    }
  }
  
  // Setup mock event handlers for development/testing
  private setupMockEventHandlers() {
    console.log("Voice service connected and ready");
  }
  
  // Send a message to the AI
  sendMessage(message: string): void {
    if (!this.isConnected) {
      console.error("WebSocket not connected");
      return;
    }
    
    console.log("Sending message to voice service:", message);
    
    // Clear any processing timeout
    if (this.processingTimeout) {
      clearTimeout(this.processingTimeout);
    }
    
    // For demo/mock purposes: simulate AI response
    this.processingTimeout = setTimeout(() => {
      const responses = [
        "I understand what you're saying. How can I help with that?",
        "That's an interesting thought. Could you tell me more?",
        "I'm here to assist with your questions. What else would you like to know?",
        "Thanks for sharing that with me. Is there anything specific you'd like to discuss?",
        `I hear you. Regarding "${message.substring(0, 20)}...", what are your thoughts?`,
        "I'm analyzing what you've said. Can you elaborate further?",
        "That's a great point. Let me think about how I can best help you with this.",
        "I appreciate you sharing that. What would be most helpful for you right now?",
        `Let me respond to your comment about "${message.substring(0, 15)}..." - what's your main concern here?`
      ];
      
      const randomResponse = responses[Math.floor(Math.random() * responses.length)];
      this.dispatchEvent('response', randomResponse);
    }, 1000);
  }
  
  // Update transcript with new text
  updateTranscript(text: string): void {
    this.lastTranscriptUpdate = Date.now();
    this.transcriptCallback(text);
  }
  
  // Disconnect from the realtime chat service
  disconnect(): void {
    console.log("Disconnecting from voice service");
    
    if (this.processingTimeout) {
      clearTimeout(this.processingTimeout);
      this.processingTimeout = null;
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
