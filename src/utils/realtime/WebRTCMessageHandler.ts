
import { WebRTCMessage, MessageMetadata } from "@/hooks/useWebRTCConnection/types";
import { saveMessage } from "@/services/messages/messageStorage";

export interface WebRTCMessageHandlerOptions {
  onTranscriptUpdate?: (text: string) => void;
  onTranscriptComplete?: () => void;
  onAudioData?: (base64Audio: string) => void;
  onAudioComplete?: () => void;
  onMessageReceived?: (message: WebRTCMessage) => void;
  onFinalTranscript?: (transcript: string) => void;
  instructions?: string;
  knowledgeEntries?: any[];
}

/**
 * Handler for WebRTC messages
 */
export class WebRTCMessageHandler {
  private options: WebRTCMessageHandlerOptions;
  private currentTranscript: string = "";
  private userDetails: Record<string, string> = {};
  
  constructor(options: WebRTCMessageHandlerOptions = {}) {
    this.options = options;
  }

  /**
   * Process incoming WebRTC messages
   */
  handleMessage(event: MessageEvent): void {
    try {
      const message = JSON.parse(event.data) as WebRTCMessage;
      
      // Log for debugging
      console.log(`[WebRTCMessageHandler] Received message: ${message.type}`, message);
      
      // Notify about all messages if callback is provided
      if (this.options.onMessageReceived) {
        this.options.onMessageReceived(message);
      }
      
      // Parse message for potential user details to maintain context
      this.extractUserDetailsFromMessage(message);
      
      // Handle different message types
      if (message.type === "response.audio.delta") {
        // Handle incoming audio data
        if (this.options.onAudioData && message.delta) {
          this.options.onAudioData(message.delta);
        }
      } 
      else if (message.type === "response.audio.done") {
        // AI has finished speaking
        console.log("[WebRTCMessageHandler] Received response.audio.done event");
        if (this.options.onAudioComplete) {
          this.options.onAudioComplete();
        }
      }
      else if (message.type === "response.audio_transcript.delta") {
        // Update transcript with new text
        if (this.options.onTranscriptUpdate && message.delta) {
          // Accumulate transcript text
          this.currentTranscript += message.delta;
          this.options.onTranscriptUpdate(this.currentTranscript);
        }
      } 
      else if (message.type === "response.audio_transcript.done") {
        // Transcript is complete
        if (this.options.onTranscriptComplete) {
          this.options.onTranscriptComplete();
          
          // Notify about final transcript if callback is provided
          if (this.options.onFinalTranscript && this.currentTranscript.trim()) {
            this.options.onFinalTranscript(this.currentTranscript);
            
            // Save the transcript to database with metadata
            this.saveTranscriptToDatabase();
          }
          
          // Reset current transcript
          this.currentTranscript = "";
        }
      }
      else if (message.type === "response.done") {
        // Response is complete - this is another signal that audio is done
        console.log("[WebRTCMessageHandler] Received response.done event");
        if (this.options.onAudioComplete) {
          this.options.onAudioComplete();
        }
      }
    } catch (error) {
      console.error("[WebRTCMessageHandler] Error handling message:", error);
    }
  }
  
  /**
   * Extract user details from messages to maintain context
   */
  private extractUserDetailsFromMessage(message: WebRTCMessage): void {
    if (message.type === "response.audio_transcript.delta" && message.delta) {
      const text = message.delta;
      
      // Extract name mentions
      const namePattern = /my name is ([A-Za-z]+)|I'm ([A-Za-z]+)|I am ([A-Za-z]+)|call me ([A-Za-z]+)/i;
      const nameMatch = text.match(namePattern);
      if (nameMatch) {
        const name = nameMatch[1] || nameMatch[2] || nameMatch[3] || nameMatch[4];
        if (name && name.length > 1) this.userDetails.userName = name;
      }
      
      // Extract partner mentions
      const partnerPattern = /my partner('s| is) ([A-Za-z]+)|partner named ([A-Za-z]+)/i;
      const partnerMatch = text.match(partnerPattern);
      if (partnerMatch) {
        const partnerName = partnerMatch[2] || partnerMatch[3];
        if (partnerName && partnerName.length > 1) this.userDetails.partnerName = partnerName;
      }
    }
  }
  
  /**
   * Save transcript to database
   */
  private saveTranscriptToDatabase(): void {
    // Skip if transcript is empty
    if (!this.currentTranscript.trim()) {
      return;
    }
    
    // Create knowledge entries with user details for context preservation
    const knowledgeEntries = [
      ...(this.options.knowledgeEntries || [])
    ];
    
    // Add user details as a knowledge entry if available
    if (Object.keys(this.userDetails).length > 0) {
      knowledgeEntries.push({
        type: 'user_details',
        content: JSON.stringify(this.userDetails),
        description: 'User details detected in conversation'
      });
    }
    
    // Save the transcript to the database with metadata
    saveMessage(this.currentTranscript, false, { 
      messageType: 'voice',
      instructions: this.options.instructions,
      knowledgeEntries: knowledgeEntries.length > 0 ? knowledgeEntries : undefined
    }).catch(error => {
      console.error("[WebRTCMessageHandler] Error saving transcript:", error);
    });
  }
  
  /**
   * Update handler options
   */
  updateOptions(newOptions: Partial<WebRTCMessageHandlerOptions>): void {
    this.options = { ...this.options, ...newOptions };
  }
}
