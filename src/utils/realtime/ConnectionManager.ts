
import { WebRTCOptions } from "@/hooks/useWebRTCConnection/types";

/**
 * Simple EventEmitter implementation
 */
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
      // Type safety: only send data if it's a valid type for RTCDataChannel.send()
      if (typeof data === 'string' || data instanceof ArrayBuffer || data instanceof Blob) {
        this.dc.send(data);
      } else if (ArrayBuffer.isView(data)) {
        this.dc.send(data);
      } else {
        console.warn("[ConnectionManager] Cannot send data, invalid data type");
      }
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
