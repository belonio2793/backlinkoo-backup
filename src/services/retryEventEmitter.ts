/**
 * Event system for tracking OpenAI retry attempts and errors
 */

export interface RetryEvent {
  type: 'retry' | 'error' | 'success' | 'timeout';
  attempt: number;
  maxAttempts: number;
  error?: string;
  nextRetryIn?: number;
  timestamp: string;
  requestId?: string;
}

type RetryEventListener = (event: RetryEvent) => void;

class RetryEventEmitter {
  private listeners: RetryEventListener[] = [];
  private events: RetryEvent[] = [];

  subscribe(listener: RetryEventListener): () => void {
    this.listeners.push(listener);
    
    // Return unsubscribe function
    return () => {
      const index = this.listeners.indexOf(listener);
      if (index > -1) {
        this.listeners.splice(index, 1);
      }
    };
  }

  emit(event: RetryEvent): void {
    this.events.push(event);
    
    // Keep only last 50 events to prevent memory leaks
    if (this.events.length > 50) {
      this.events = this.events.slice(-50);
    }

    this.listeners.forEach(listener => {
      try {
        listener(event);
      } catch (error) {
        console.error('Error in retry event listener:', error);
      }
    });
  }

  getRecentEvents(count: number = 10): RetryEvent[] {
    return this.events.slice(-count);
  }

  clear(): void {
    this.events = [];
  }
}

export const retryEventEmitter = new RetryEventEmitter();
