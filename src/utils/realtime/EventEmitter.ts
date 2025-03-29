
/**
 * Simple event emitter for managing event listeners
 */
export class EventEmitter {
  private eventListeners: Map<string, Function[]>;

  constructor() {
    this.eventListeners = new Map();
  }

  /**
   * Register an event listener
   */
  addEventListener(eventName: string, callback: Function): void {
    if (!this.eventListeners.has(eventName)) {
      this.eventListeners.set(eventName, []);
    }
    this.eventListeners.get(eventName)?.push(callback);
  }

  /**
   * Remove an event listener
   */
  removeEventListener(eventName: string, callback: Function): void {
    const listeners = this.eventListeners.get(eventName);
    if (!listeners) return;
    
    const index = listeners.indexOf(callback);
    if (index !== -1) {
      listeners.splice(index, 1);
    }
  }

  /**
   * Dispatch an event to all listeners
   */
  dispatchEvent(eventName: string, data: any): void {
    const listeners = this.eventListeners.get(eventName);
    if (!listeners) return;
    
    for (const callback of listeners) {
      callback(data);
    }
  }

  /**
   * Remove all event listeners
   */
  removeAllEventListeners(): void {
    this.eventListeners.clear();
  }
}
