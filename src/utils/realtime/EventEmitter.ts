
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
   * @returns The function that was registered (for removal later)
   */
  addEventListener(eventName: string, callback: Function): Function {
    if (!this.eventListeners.has(eventName)) {
      this.eventListeners.set(eventName, []);
    }
    this.eventListeners.get(eventName)?.push(callback);
    return callback; // Return the callback for easier removal
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

  /**
   * Alternative API: Subscribe to events (alias for addEventListener)
   */
  subscribe(callback: Function): () => void {
    const eventName = 'event';
    if (!this.eventListeners.has(eventName)) {
      this.eventListeners.set(eventName, []);
    }
    this.eventListeners.get(eventName)?.push(callback);
    
    // Return unsubscribe function
    return () => {
      const listeners = this.eventListeners.get(eventName);
      if (!listeners) return;
      
      const index = listeners.indexOf(callback);
      if (index !== -1) {
        listeners.splice(index, 1);
      }
    };
  }

  /**
   * Alternative API: Emit an event (alias for dispatchEvent)
   */
  emit(data: any): void {
    this.dispatchEvent('event', data);
  }
}
