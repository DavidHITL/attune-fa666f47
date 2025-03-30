
/**
 * Handles promises related to WebSocket connection
 */
export class WebSocketPromiseHandler {
  private openPromiseResolve: (() => void) | null = null;
  private openPromiseReject: ((reason?: any) => void) | null = null;

  /**
   * Create a new connection promise
   */
  createConnectionPromise(): Promise<void> {
    return new Promise<void>((resolve, reject) => {
      this.openPromiseResolve = resolve;
      this.openPromiseReject = reject;
    });
  }

  /**
   * Resolve the open promise
   */
  resolveOpenPromise(): void {
    if (this.openPromiseResolve) {
      this.openPromiseResolve();
      this.openPromiseResolve = null;
    }
  }

  /**
   * Reject the open promise
   */
  rejectOpenPromise(reason: any): void {
    if (this.openPromiseReject) {
      this.openPromiseReject(reason);
      this.openPromiseReject = null;
    }
  }
}
