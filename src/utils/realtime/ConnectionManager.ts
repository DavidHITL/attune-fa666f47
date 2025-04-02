
import { WebRTCOptions } from "@/hooks/useWebRTCConnection/types";
import { EventEmitter } from "./EventEmitter";

/**
 * Connection Manager for WebRTC
 */
export class ConnectionManager {
  pc: RTCPeerConnection;
  dc: RTCDataChannel;
  private eventEmitter: EventEmitter;
  private options: WebRTCOptions;

  constructor(options: WebRTCOptions = {}) {
    this.pc = new RTCPeerConnection({
      iceServers: [{ urls: 'stun:stun.l.google.com:19302' }]
    });
    this.dc = this.pc.createDataChannel('oai-events');
    this.eventEmitter = new EventEmitter();
    this.options = options;
  }

  onOpen(callback: () => void): void {
    this.eventEmitter.on('open', callback);
  }

  onClose(callback: () => void): void {
    this.eventEmitter.on('close', callback);
  }

  onError(callback: (error: any) => void): void {
    this.eventEmitter.on('error', callback);
  }

  onMessage(callback: (message: any) => void): void {
    this.eventEmitter.on('message', callback);
  }

  async connect(): Promise<boolean> {
    try {
      // Implementation of connection logic
      return true;
    } catch (error) {
      this.eventEmitter.emit('error', error);
      return false;
    }
  }

  send(data: string | ArrayBufferLike | Blob | ArrayBufferView): void {
    if (this.dc.readyState === 'open') {
      this.dc.send(data);
    } else {
      console.warn("[ConnectionManager] Cannot send data, data channel not open");
    }
  }

  disconnect(): void {
    if (this.pc.connectionState !== 'closed') {
      this.pc.close();
    }
    if (this.dc.readyState !== 'closed') {
      this.dc.close();
    }
  }
}

// Create an EventEmitter class
export class EventEmitter {
  private events: Record<string, Function[]> = {};

  on(event: string, listener: Function): void {
    if (!this.events[event]) {
      this.events[event] = [];
    }
    this.events[event].push(listener);
  }

  emit(event: string, ...args: any[]): void {
    if (this.events[event]) {
      this.events[event].forEach(listener => listener(...args));
    }
  }

  off(event: string, listener: Function): void {
    if (this.events[event]) {
      this.events[event] = this.events[event].filter(l => l !== listener);
    }
  }
}
