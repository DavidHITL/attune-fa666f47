
/**
 * Manages promise lifecycle for async operations
 */
export class PromiseManager {
  private openPromise: Promise<void> | null = null;
  private openPromiseResolve: (() => void) | null = null;
  private openPromiseReject: ((reason?: any) => void) | null = null;

  /**
   * Create a new promise
   */
  createPromise(): Promise<void> {
    if (this.openPromise) {
      console.log("Promise already in progress, returning existing promise");
      return this.openPromise;
    }
    
    this.openPromise = new Promise<void>((resolve, reject) => {
      this.openPromiseResolve = resolve;
      this.openPromiseReject = reject;
    });
    
    return this.openPromise;
  }

  /**
   * Reset the promise state
   */
  resetPromise(): void {
    this.openPromise = null;
    this.openPromiseResolve = null;
    this.openPromiseReject = null;
  }

  /**
   * Resolve the open promise
   */
  resolvePromise(): void {
    if (this.openPromiseResolve) {
      this.openPromiseResolve();
      this.resetPromise();
    }
  }

  /**
   * Reject the open promise
   */
  rejectPromise(error: any): void {
    if (this.openPromiseReject) {
      this.openPromiseReject(error);
      this.resetPromise();
    }
  }
}
