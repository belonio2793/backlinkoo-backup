/**
 * Crypto Wallet Extension Conflict Handler
 * 
 * Handles conflicts between multiple crypto wallet browser extensions
 * (Phantom, MetaMask, Coinbase Wallet, etc.) that try to inject ethereum/web3 objects
 */

export class CryptoWalletHandler {
  private static initialized = false;
  private static conflictCount = 0;
  private static lastConflictTime = 0;

  /**
   * Initialize protection against wallet extension conflicts
   */
  static initialize(): void {
    if (this.initialized || typeof window === 'undefined') {
      return;
    }

    this.initialized = true;
    console.log('🔒 Initializing enhanced crypto wallet conflict protection...');

    // Protect wallet properties with enhanced approach
    this.protectGlobalProperty('ethereum');
    this.protectGlobalProperty('web3');
    this.protectGlobalProperty('solana');

    // Add error listeners specifically for wallet conflicts
    this.addWalletErrorListeners();

    console.log('✅ Enhanced crypto wallet conflict protection initialized');
  }

  /**
   * Protect a global property from redefinition conflicts using a more flexible approach
   */
  private static protectGlobalProperty(propertyName: string): void {
    try {
      const existing = (window as any)[propertyName];
      const descriptor = Object.getOwnPropertyDescriptor(window, propertyName);

      // Only set up protection if property is configurable or doesn't exist
      if (!descriptor || descriptor.configurable) {
        let currentValue = existing;
        
        // Use getter/setter to allow controlled access
        Object.defineProperty(window, propertyName, {
          get() {
            return currentValue;
          },
          set(newValue) {
            // Log wallet extension injections but allow them
            if (newValue && typeof newValue === 'object') {
              console.log(`🔧 ${propertyName} wallet extension detected and allowed`);
            }
            currentValue = newValue;
          },
          configurable: true, // Keep configurable to allow extensions to inject
          enumerable: true
        });

        console.log(`🔧 Set up flexible protection for ${propertyName} property`);
      } else {
        console.log(`🔒 ${propertyName} property already protected or non-configurable`);
      }
    } catch (error: any) {
      // Don't treat this as a critical error - extensions should still work
      console.log(`🚫 ${propertyName} property protection skipped:`, error.message);
    }
  }

  /**
   * Add error listeners for wallet-specific conflicts with improved handling
   */
  private static addWalletErrorListeners(): void {
    const handleWalletError = (error: any, source: string) => {
      const message = error?.message || '';
      const stack = error?.stack || '';
      const fileName = error?.fileName || '';

      const isWalletError = 
        message.includes('Cannot redefine property: ethereum') ||
        message.includes('Cannot redefine property: web3') ||
        message.includes('Cannot redefine property: solana') ||
        message.includes('evmAsk') ||
        message.includes('MetaMask') ||
        message.includes('Phantom') ||
        message.includes('Coinbase') ||
        stack.includes('chrome-extension://') ||
        stack.includes('moz-extension://') ||
        fileName.includes('chrome-extension://') ||
        fileName.includes('moz-extension://');

      if (isWalletError) {
        this.conflictCount++;
        this.lastConflictTime = Date.now();
        console.log(`🔒 Wallet extension event #${this.conflictCount} handled (${source}):`, message);
        return true; // Indicates we handled this error
      }

      return false;
    };

    // Enhanced error handler that's less aggressive
    const originalErrorHandler = window.onerror;
    window.onerror = (message, source, lineno, colno, error) => {
      if (handleWalletError(error, 'global-error')) {
        // Don't prevent the error entirely, just log it
        return false; // Let other handlers process it too
      }
      
      // Call original handler if it exists
      if (originalErrorHandler) {
        return originalErrorHandler.call(window, message, source, lineno, colno, error);
      }
      
      return false;
    };

    // Handle promise rejections more gracefully
    window.addEventListener('unhandledrejection', (event) => {
      if (handleWalletError(event.reason, 'promise-rejection')) {
        // Log but don't prevent - let the app handle it if needed
        console.log('🔒 Wallet-related promise rejection logged and ignored');
      }
    });

    // Add specific listener for extension injection events
    window.addEventListener('error', (event) => {
      if (event.error && handleWalletError(event.error, 'error-event')) {
        event.stopImmediatePropagation();
        console.log('🔒 Wallet extension error event handled');
      }
    }, true); // Use capture phase
  }

  /**
   * Get statistics about wallet conflicts
   */
  static getConflictStats(): { conflictCount: number; isInitialized: boolean; lastConflictTime: number } {
    return {
      conflictCount: this.conflictCount,
      isInitialized: this.initialized,
      lastConflictTime: this.lastConflictTime
    };
  }

  /**
   * Reset conflict counter (useful for testing)
   */
  static resetStats(): void {
    this.conflictCount = 0;
    this.lastConflictTime = 0;
  }

  /**
   * Force reinitialization - useful when conflicts are detected
   */
  static reinitialize(): void {
    this.initialized = false;
    this.conflictCount = 0;
    this.lastConflictTime = 0;
    this.initialize();
  }

  /**
   * Check if there are active wallet conflicts
   */
  static hasActiveConflicts(): boolean {
    const timeSinceLastConflict = Date.now() - this.lastConflictTime;
    return this.conflictCount > 0 && timeSinceLastConflict < 60000; // Active if within last minute
  }

  /**
   * Check if a specific wallet is available
   */
  static isWalletAvailable(walletType: 'ethereum' | 'solana' | 'web3'): boolean {
    try {
      return !!(window as any)[walletType];
    } catch {
      return false;
    }
  }

  /**
   * Get available wallets
   */
  static getAvailableWallets(): string[] {
    const wallets: string[] = [];
    
    ['ethereum', 'solana', 'web3'].forEach(wallet => {
      if (this.isWalletAvailable(wallet as any)) {
        wallets.push(wallet);
      }
    });

    return wallets;
  }
}

// Auto-initialize if we're in a browser environment
if (typeof window !== 'undefined') {
  // Use multiple initialization attempts to handle timing issues
  const initAttempts = [0, 50, 100, 500];
  
  initAttempts.forEach(delay => {
    setTimeout(() => {
      if (!CryptoWalletHandler.getConflictStats().isInitialized) {
        CryptoWalletHandler.initialize();
      }
    }, delay);
  });
  
  // Additional initialization on DOMContentLoaded
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      setTimeout(() => CryptoWalletHandler.initialize(), 10);
    });
  }
}
