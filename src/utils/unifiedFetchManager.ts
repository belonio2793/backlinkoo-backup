/**
 * Unified Fetch Manager
 * 
 * This service coordinates all fetch interceptors to prevent conflicts
 * and cascading wrapper issues that cause "Failed to fetch" errors.
 */

interface FetchInterceptor {
  id: string;
  priority: number;
  interceptor: (originalFetch: typeof fetch) => typeof fetch;
  enabled: boolean;
}

class UnifiedFetchManager {
  private static instance: UnifiedFetchManager;
  private originalFetch: typeof fetch;
  private interceptors: Map<string, FetchInterceptor> = new Map();
  private isInitialized = false;
  private currentFetch: typeof fetch;

  private constructor() {
    // Store the truly original fetch before any modifications
    this.originalFetch = this.getTrulyOriginalFetch();
    this.currentFetch = this.originalFetch;
  }

  static getInstance(): UnifiedFetchManager {
    if (!UnifiedFetchManager.instance) {
      UnifiedFetchManager.instance = new UnifiedFetchManager();
    }
    return UnifiedFetchManager.instance;
  }

  /**
   * Get the original fetch function before any modifications
   */
  private getTrulyOriginalFetch(): typeof fetch {
    // Try to get original fetch from various backup locations
    if ((window as any).__ORIGINAL_FETCH__) {
      return (window as any).__ORIGINAL_FETCH__;
    }
    if ((window as any).__originalFetch__) {
      return (window as any).__originalFetch__;
    }
    if ((window as any)._originalFetch) {
      return (window as any)._originalFetch;
    }

    // Create clean fetch from iframe if needed
    try {
      const iframe = document.createElement('iframe');
      iframe.style.display = 'none';
      document.body.appendChild(iframe);
      const cleanFetch = iframe.contentWindow?.fetch?.bind(window);
      document.body.removeChild(iframe);
      
      if (cleanFetch) {
        return cleanFetch;
      }
    } catch (error) {
      console.warn('Could not create clean fetch from iframe:', error);
    }

    // Fallback to current window.fetch
    return window.fetch.bind(window);
  }

  /**
   * Register a fetch interceptor
   */
  registerInterceptor(
    id: string, 
    interceptor: (originalFetch: typeof fetch) => typeof fetch,
    priority: number = 100,
    enabled: boolean = true
  ): void {
    console.log(`🔧 Registering fetch interceptor: ${id} (priority: ${priority})`);
    
    this.interceptors.set(id, {
      id,
      priority,
      interceptor,
      enabled
    });

    this.rebuildFetchChain();
  }

  /**
   * Unregister a fetch interceptor
   */
  unregisterInterceptor(id: string): void {
    if (this.interceptors.has(id)) {
      console.log(`🗑️ Unregistering fetch interceptor: ${id}`);
      this.interceptors.delete(id);
      this.rebuildFetchChain();
    }
  }

  /**
   * Enable/disable an interceptor
   */
  setInterceptorEnabled(id: string, enabled: boolean): void {
    const interceptor = this.interceptors.get(id);
    if (interceptor) {
      interceptor.enabled = enabled;
      this.rebuildFetchChain();
    }
  }

  /**
   * Rebuild the fetch chain with all active interceptors
   */
  private rebuildFetchChain(): void {
    console.log('🔄 Rebuilding fetch chain...');
    
    // Start with the original fetch
    let currentFetch = this.originalFetch;

    // Get active interceptors sorted by priority (highest first)
    const activeInterceptors = Array.from(this.interceptors.values())
      .filter(i => i.enabled)
      .sort((a, b) => b.priority - a.priority);

    console.log(`📋 Active interceptors: ${activeInterceptors.map(i => i.id).join(', ')}`);

    // Apply interceptors in priority order
    for (const interceptor of activeInterceptors) {
      try {
        currentFetch = interceptor.interceptor(currentFetch);
      } catch (error) {
        console.error(`❌ Failed to apply interceptor ${interceptor.id}:`, error);
      }
    }

    // Update window.fetch
    this.currentFetch = currentFetch;
    window.fetch = currentFetch;

    console.log('✅ Fetch chain rebuilt successfully');
  }

  /**
   * Reset to original fetch and clear all interceptors
   */
  reset(): void {
    console.log('🔄 Resetting to original fetch...');
    this.interceptors.clear();
    window.fetch = this.originalFetch;
    this.currentFetch = this.originalFetch;
    console.log('✅ Fetch reset complete');
  }

  /**
   * Get current status
   */
  getStatus(): any {
    return {
      interceptorCount: this.interceptors.size,
      activeInterceptors: Array.from(this.interceptors.values())
        .filter(i => i.enabled)
        .map(i => ({ id: i.id, priority: i.priority })),
      hasOriginalFetch: !!this.originalFetch,
      isChainBuilt: this.currentFetch !== this.originalFetch
    };
  }

  /**
   * Initialize with safe defaults
   */
  initialize(): void {
    if (this.isInitialized) {
      return;
    }

    console.log('🚀 Initializing Unified Fetch Manager...');

    // Store original fetch in multiple backup locations
    (window as any).__ORIGINAL_FETCH__ = this.originalFetch;
    (window as any).__originalFetch__ = this.originalFetch;
    (window as any)._originalFetch = this.originalFetch;

    // Register essential interceptors with proper priorities
    this.registerBasicInterceptors();

    this.isInitialized = true;
    console.log('✅ Unified Fetch Manager initialized');
  }

  /**
   * Register basic essential interceptors
   */
  private registerBasicInterceptors(): void {
    // Network error handling (highest priority)
    this.registerInterceptor('network-error-handler', (originalFetch) => {
      return async (...args) => {
        try {
          const response = await originalFetch(...args);
          return response;
        } catch (error) {
          console.warn('🌐 Network fetch error:', error);
          throw error;
        }
      };
    }, 1000);

    // Timeout handler
    this.registerInterceptor('timeout-handler', (originalFetch) => {
      return async (input, init = {}) => {
        if (!init.signal) {
          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), 30000);
          
          try {
            const response = await originalFetch(input, { ...init, signal: controller.signal });
            clearTimeout(timeoutId);
            return response;
          } catch (error) {
            clearTimeout(timeoutId);
            throw error;
          }
        }
        
        return originalFetch(input, init);
      };
    }, 900);
  }
}

// Create singleton instance
const fetchManager = UnifiedFetchManager.getInstance();

// Export for use
export { fetchManager };

// Initialize on import
if (typeof window !== 'undefined') {
  // Don't initialize immediately to avoid conflicts during startup
  setTimeout(() => {
    fetchManager.initialize();
  }, 100);

  // Make available globally for debugging
  (window as any).fetchManager = fetchManager;
  (window as any).resetFetch = () => fetchManager.reset();
  
  console.log('🔧 Unified Fetch Manager loaded. Use window.fetchManager for debugging.');
}
