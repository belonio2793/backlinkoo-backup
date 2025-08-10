/**
 * Deadlock Prevention Service
 * Prevents database deadlocks by managing concurrent operations
 */

class DeadlockPreventionService {
  private static operationQueue: Map<string, Promise<any>> = new Map();
  private static readonly MAX_CONCURRENT_OPS = 3;
  private static readonly OPERATION_TIMEOUT = 30000; // 30 seconds

  /**
   * Execute database operation with deadlock prevention
   */
  static async executeWithDeadlockPrevention<T>(
    operationKey: string,
    operation: () => Promise<T>,
    timeout: number = this.OPERATION_TIMEOUT
  ): Promise<T> {
    
    // Check if this operation is already running
    if (this.operationQueue.has(operationKey)) {
      console.log(`⏳ Operation ${operationKey} already running, waiting...`);
      return await this.operationQueue.get(operationKey);
    }

    // Check if we have too many concurrent operations
    if (this.operationQueue.size >= this.MAX_CONCURRENT_OPS) {
      console.log(`⚠️ Too many concurrent operations (${this.operationQueue.size}), waiting...`);
      
      // Wait for one operation to complete
      await Promise.race(Array.from(this.operationQueue.values()));
    }

    // Create timeout promise
    const timeoutPromise = new Promise<never>((_, reject) => {
      setTimeout(() => reject(new Error(`Operation ${operationKey} timed out after ${timeout}ms`)), timeout);
    });

    // Execute operation with timeout
    const operationPromise = Promise.race([
      operation(),
      timeoutPromise
    ]);

    // Add to queue
    this.operationQueue.set(operationKey, operationPromise);

    try {
      const result = await operationPromise;
      return result;
    } catch (error) {
      console.error(`❌ Operation ${operationKey} failed:`, error);
      
      // If it's a deadlock error, retry once
      if (error.message?.includes('deadlock') || error.code === '40P01') {
        console.log(`🔄 Deadlock detected, retrying ${operationKey}...`);
        
        // Wait a random delay to avoid immediate re-deadlock
        await new Promise(resolve => setTimeout(resolve, Math.random() * 1000 + 500));
        
        // Retry without adding to queue again
        return await operation();
      }
      
      throw error;
    } finally {
      // Always remove from queue
      this.operationQueue.delete(operationKey);
    }
  }

  /**
   * Execute campaign metrics operations safely
   */
  static async safeCampaignMetricsOperation<T>(
    userId: string,
    campaignId: string,
    operation: () => Promise<T>
  ): Promise<T> {
    const operationKey = `campaign-metrics-${userId}-${campaignId}`;
    
    return this.executeWithDeadlockPrevention(
      operationKey,
      operation,
      15000 // Shorter timeout for metrics
    );
  }

  /**
   * Execute profile operations safely
   */
  static async safeProfileOperation<T>(
    userId: string,
    operation: () => Promise<T>
  ): Promise<T> {
    const operationKey = `profile-${userId}`;
    
    return this.executeWithDeadlockPrevention(
      operationKey,
      operation,
      10000 // Short timeout for profile ops
    );
  }

  /**
   * Execute payment operations safely
   */
  static async safePaymentOperation<T>(
    sessionId: string,
    operation: () => Promise<T>
  ): Promise<T> {
    const operationKey = `payment-${sessionId}`;
    
    return this.executeWithDeadlockPrevention(
      operationKey,
      operation,
      60000 // Longer timeout for payments
    );
  }

  /**
   * Clear all pending operations (emergency reset)
   */
  static clearAllOperations(): void {
    console.log('🧹 Clearing all pending operations');
    this.operationQueue.clear();
  }

  /**
   * Get current operation status
   */
  static getStatus(): {
    pendingOperations: number;
    operationKeys: string[];
  } {
    return {
      pendingOperations: this.operationQueue.size,
      operationKeys: Array.from(this.operationQueue.keys())
    };
  }

  /**
   * Handle deadlock errors gracefully
   */
  static handleDeadlockError(error: any, context: string): {
    isDeadlock: boolean;
    shouldRetry: boolean;
    message: string;
  } {
    const isDeadlock = error.code === '40P01' || 
                      error.message?.includes('deadlock') ||
                      error.message?.includes('lock timeout');

    if (isDeadlock) {
      console.error(`🔒 Deadlock detected in ${context}:`, {
        code: error.code,
        message: error.message,
        context
      });

      return {
        isDeadlock: true,
        shouldRetry: true,
        message: 'Database operation deadlock detected. The operation will be retried automatically.'
      };
    }

    return {
      isDeadlock: false,
      shouldRetry: false,
      message: error.message || 'Unknown database error'
    };
  }

  /**
   * Initialize deadlock prevention with cleanup
   */
  static initialize(): void {
    // Clear operations on page load
    this.clearAllOperations();

    // Set up cleanup on page unload
    if (typeof window !== 'undefined') {
      window.addEventListener('beforeunload', () => {
        this.clearAllOperations();
      });

      // Periodic cleanup of stale operations
      setInterval(() => {
        const status = this.getStatus();
        if (status.pendingOperations > 10) {
          console.warn('⚠️ Too many pending operations, clearing queue');
          this.clearAllOperations();
        }
      }, 60000); // Every minute
    }
  }
}

// Auto-initialize
DeadlockPreventionService.initialize();

export default DeadlockPreventionService;
export { DeadlockPreventionService };
