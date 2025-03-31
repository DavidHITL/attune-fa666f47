
import { EventEmitter } from '../EventEmitter';

/**
 * Manages WebRTC connections and related operations
 */
export class WebRTCManager {
  private pc: RTCPeerConnection | null = null;
  private dc: RTCDataChannel | null = null;
  private audioElement: HTMLAudioElement | null = null;
  private audioContext: AudioContext | null = null;
  private eventEmitter: EventEmitter;
  private localStream: MediaStream | null = null;
  
  constructor(eventEmitter: EventEmitter) {
    this.eventEmitter = eventEmitter;
    
    // Initialize audio elements
    this.audioElement = document.createElement('audio');
    this.audioElement.autoplay = true;
    
    // Try to create AudioContext
    try {
      this.audioContext = new AudioContext({
        sampleRate: 24000, // Required sample rate for OpenAI
      });
    } catch (e) {
      console.error("[WebRTCManager] Failed to initialize AudioContext:", e);
    }
  }
  
  /**
   * Initialize WebRTC connection with OpenAI
   */
  async initializeConnection(ephemeralKey: string): Promise<void> {
    try {
      // Create peer connection with improved ICE servers configuration
      this.pc = new RTCPeerConnection({
        iceServers: [
          { urls: 'stun:stun.l.google.com:19302' },
          { urls: 'stun:stun1.l.google.com:19302' },
          { urls: 'stun:stun2.l.google.com:19302' }
        ]
      });
      
      // Set up data channel for events
      this.setupDataChannel();
      
      // IMPORTANT: First get user media and add tracks BEFORE creating the offer
      try {
        console.log("[WebRTCManager] Requesting user media for audio");
        this.localStream = await navigator.mediaDevices.getUserMedia({ 
          audio: {
            echoCancellation: true,
            noiseSuppression: true,
            autoGainControl: true
          }
        });
        
        // Add all audio tracks to the peer connection
        this.localStream.getAudioTracks().forEach(track => {
          if (this.pc) {
            console.log("[WebRTCManager] Adding audio track to peer connection:", track.id, track.kind);
            this.pc.addTrack(track, this.localStream!);
          }
        });
      } catch (err) {
        console.error("[WebRTCManager] Failed to get user media:", err);
        // Continue anyway - we'll still create an offer but it won't have audio tracks
        // This will allow debugging other aspects of the connection
      }
      
      // Set up handlers for received audio
      this.setupAudioTracks();
      
      // Wait a brief moment to ensure tracks are properly added
      await new Promise(resolve => setTimeout(resolve, 100));
      
      // Create and set local description
      console.log("[WebRTCManager] Creating offer");
      const offer = await this.pc.createOffer({
        offerToReceiveAudio: true // Explicitly request to receive audio
        // Removed the invalid voiceActivityDetection property
      });
      
      console.log("[WebRTCManager] Setting local description");
      await this.pc.setLocalDescription(offer);
      
      // Connect to OpenAI's Realtime API
      console.log("[WebRTCManager] Creating connection with OpenAI");
      const baseUrl = "https://api.openai.com/v1/realtime";
      const model = "gpt-4o-realtime-preview-2024-12-17";
      
      // Log the SDP for debugging
      console.log("[WebRTCManager] SDP being sent:", offer.sdp);
      
      const sdpResponse = await fetch(`${baseUrl}?model=${model}`, {
        method: "POST",
        body: offer.sdp,
        headers: {
          Authorization: `Bearer ${ephemeralKey}`,
          "Content-Type": "application/sdp"
        },
      });
      
      if (!sdpResponse.ok) {
        const errorText = await sdpResponse.text();
        throw new Error(`OpenAI SDP error: ${sdpResponse.status} ${errorText}`);
      }
      
      const answer = {
        type: "answer" as RTCSdpType,
        sdp: await sdpResponse.text(),
      };
      
      await this.pc.setRemoteDescription(answer);
      console.log("[WebRTCManager] WebRTC connection established");
      
    } catch (error) {
      console.error("[WebRTCManager] Connection initialization failed:", error);
      throw error;
    }
  }
  
  /**
   * Set up WebRTC data channel
   */
  private setupDataChannel(): void {
    if (!this.pc) return;
    
    this.dc = this.pc.createDataChannel("oai-events");
    
    this.dc.addEventListener("message", (e) => {
      try {
        const event = JSON.parse(e.data);
        this.dispatchEvent('webrtc-event', event);
      } catch (error) {
        console.error("[WebRTCManager] Error processing message:", error);
      }
    });
    
    this.dc.addEventListener("open", () => {
      console.log("[WebRTCManager] Data channel opened");
      this.dispatchEvent('data-channel-open', null);
    });
    
    this.dc.addEventListener("close", () => {
      console.log("[WebRTCManager] Data channel closed");
      this.dispatchEvent('data-channel-close', null);
    });
    
    this.dc.addEventListener("error", (error) => {
      console.error("[WebRTCManager] Data channel error:", error);
      this.dispatchEvent('data-channel-error', error);
    });
  }
  
  /**
   * Set up audio tracks for WebRTC
   */
  private setupAudioTracks(): void {
    if (!this.pc) return;
    
    // Handle incoming audio streams
    this.pc.ontrack = (event) => {
      console.log("[WebRTCManager] Received audio track");
      
      if (this.audioElement && event.streams[0]) {
        this.audioElement.srcObject = event.streams[0];
      }
    };
  }

  /**
   * Send a message through the data channel
   */
  sendMessage(message: any): boolean {
    if (!this.dc || this.dc.readyState !== 'open') {
      console.warn("[WebRTCManager] Cannot send message: Data channel not open");
      return false;
    }
    
    try {
      this.dc.send(JSON.stringify(message));
      return true;
    } catch (error) {
      console.error("[WebRTCManager] Error sending message:", error);
      return false;
    }
  }
  
  /**
   * Close WebRTC connection
   */
  close(): void {
    // Close local media streams
    if (this.localStream) {
      this.localStream.getTracks().forEach(track => {
        track.stop();
      });
      this.localStream = null;
    }
    
    // Close data channel
    if (this.dc) {
      try {
        this.dc.close();
      } catch (e) {
        // Ignore errors during cleanup
      }
      this.dc = null;
    }
    
    // Close peer connection
    if (this.pc) {
      try {
        this.pc.close();
      } catch (e) {
        // Ignore errors during cleanup
      }
      this.pc = null;
    }
    
    // Clear audio element
    if (this.audioElement) {
      this.audioElement.srcObject = null;
    }
  }
  
  /**
   * Check if WebRTC connection is established
   */
  isConnected(): boolean {
    return !!this.pc && !!this.dc && this.dc.readyState === 'open';
  }
  
  /**
   * Dispatch event to event emitter
   */
  private dispatchEvent(eventName: string, data: any): void {
    this.eventEmitter.dispatchEvent(eventName, data);
  }
}
