/**
 * Crypto Wallet Extension Conflict Handler
 * 
 * Handles conflicts between multiple crypto wallet browser extensions
 * (Phantom, MetaMask, Coinbase Wallet, etc.) that try to inject ethereum/web3 objects
 */

export class CryptoWalletHandler {
  private static initialized = false;
  private static conflictCount = 0;

  /**
   * Initialize protection against wallet extension conflicts
   */
  static initialize(): void {
    if (this.initialized || typeof window === 'undefined') {
      return;
    }

    this.initialized = true;
    console.log('🔒 Initializing crypto wallet conflict protection...');

    // Protect ethereum property
    this.protectGlobalProperty('ethereum');
    this.protectGlobalProperty('web3');
    this.protectGlobalProperty('solana');

    // Add error listeners specifically for wallet conflicts
    this.addWalletErrorListeners();

    console.log('✅ Crypto wallet conflict protection initialized');
  }

  /**
   * Protect a global property from redefinition conflicts
   */
  private static protectGlobalProperty(propertyName: string): void {
    try {
      const existing = (window as any)[propertyName];
      const descriptor = Object.getOwnPropertyDescriptor(window, propertyName);

      // If property doesn't exist or is configurable, set it up with protection
      if (!descriptor || descriptor.configurable) {
        if (existing) {
          delete (window as any)[propertyName];
        }

        Object.defineProperty(window, propertyName, {
          value: existing || null,
          writable: true,
          configurable: false, // Prevent further redefinition
          enumerable: true
        });

        console.log(`🔧 Protected ${propertyName} property from redefinition`);
      }
    } catch (error: any) {
      console.warn(`⚠️ Could not protect ${propertyName} property:`, error.message);
    }
  }

  /**
   * Add error listeners for wallet-specific conflicts
   */
  private static addWalletErrorListeners(): void {
    const handleWalletError = (error: any, source: string) => {
      const message = error?.message || '';
      const stack = error?.stack || '';

      const isWalletError = 
        message.includes('Cannot redefine property: ethereum') ||
        message.includes('Cannot redefine property: web3') ||
        message.includes('Cannot redefine property: solana') ||
        message.includes('evmAsk') ||
        stack.includes('chrome-extension://') ||
        stack.includes('moz-extension://');

      if (isWalletError) {
        this.conflictCount++;
        console.warn(`🔒 Wallet extension conflict #${this.conflictCount} handled (${source}):`, message);
        return true; // Indicates we handled this error
      }

      return false;
    };

    // Handle synchronous errors
    const originalErrorHandler = window.onerror;
    window.onerror = (message, source, lineno, colno, error) => {
      if (handleWalletError(error, 'window.onerror')) {
        return true; // Prevent default error handling
      }
      
      // Call original handler if it exists
      if (originalErrorHandler) {
        return originalErrorHandler.call(window, message, source, lineno, colno, error);
      }
      
      return false;
    };

    // Handle promise rejections
    window.addEventListener('unhandledrejection', (event) => {
      if (handleWalletError(event.reason, 'unhandledrejection')) {
        event.preventDefault();
      }
    });
  }

  /**
   * Get statistics about wallet conflicts
   */
  static getConflictStats(): { conflictCount: number; isInitialized: boolean } {
    return {
      conflictCount: this.conflictCount,
      isInitialized: this.initialized
    };
  }

  /**
   * Reset conflict counter (useful for testing)
   */
  static resetStats(): void {
    this.conflictCount = 0;
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
  // Use a small delay to let the page load first
  setTimeout(() => {
    CryptoWalletHandler.initialize();
  }, 100);
}
