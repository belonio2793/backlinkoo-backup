/**
 * Force Production Mode Utility
 * Ensures Telegraph publishing uses live API instead of mock services
 */

export class ProductionModeForcer {
  
  /**
   * Force all automation services to use live APIs
   */
  static forceProductionMode(): void {
    console.log('🚀 Forcing production mode - disabling all mock services');
    
    // Override environment detection globally
    if (typeof window !== 'undefined') {
      // Set production flags
      (window as any).__FORCE_PRODUCTION_MODE = true;
      (window as any).__DISABLE_MOCK_SERVICES = true;
      
      // Clear any mock service flags
      localStorage.removeItem('use_mock_services');
      localStorage.removeItem('development_mode');
      localStorage.setItem('force_production', 'true');
      
      console.log('✅ Production mode forced globally');
    }
  }
  
  /**
   * Check if production mode is forced
   */
  static isProductionModeForced(): boolean {
    if (typeof window === 'undefined') return false;
    
    return (window as any).__FORCE_PRODUCTION_MODE === true ||
           localStorage.getItem('force_production') === 'true';
  }
  
  /**
   * Enable Telegraph live publishing specifically
   */
  static enableLiveTelegraph(): void {
    console.log('📤 Enabling live Telegraph publishing');
    
    if (typeof window !== 'undefined') {
      (window as any).__TELEGRAPH_LIVE_MODE = true;
      localStorage.setItem('telegraph_live_mode', 'true');
      
      console.log('✅ Telegraph live mode enabled');
    }
  }
  
  /**
   * Check if Telegraph should use live API
   */
  static shouldUseLiveTelegraph(): boolean {
    if (typeof window === 'undefined') return true; // Default to live on server
    
    return (window as any).__TELEGRAPH_LIVE_MODE === true ||
           localStorage.getItem('telegraph_live_mode') === 'true' ||
           this.isProductionModeForced();
  }
  
  /**
   * Reset to automatic mode detection
   */
  static resetToAutoMode(): void {
    console.log('🔄 Resetting to automatic mode detection');
    
    if (typeof window !== 'undefined') {
      delete (window as any).__FORCE_PRODUCTION_MODE;
      delete (window as any).__DISABLE_MOCK_SERVICES;
      delete (window as any).__TELEGRAPH_LIVE_MODE;
      
      localStorage.removeItem('force_production');
      localStorage.removeItem('telegraph_live_mode');
      
      console.log('✅ Reset to automatic mode');
    }
  }
  
  /**
   * Get current mode status
   */
  static getModeStatus(): {
    isProductionForced: boolean;
    isLiveTelegraphEnabled: boolean;
    currentHostname: string;
    recommendedAction: string;
  } {
    const hostname = typeof window !== 'undefined' ? window.location.hostname : 'server';
    const isProductionForced = this.isProductionModeForced();
    const isLiveTelegraphEnabled = this.shouldUseLiveTelegraph();
    
    let recommendedAction = 'No action needed';
    
    if (hostname.includes('localhost')) {
      recommendedAction = 'Development environment detected - mock services are appropriate';
    } else if (!isLiveTelegraphEnabled) {
      recommendedAction = 'Production environment - should enable live Telegraph';
    } else {
      recommendedAction = 'Production mode active - all services are live';
    }
    
    return {
      isProductionForced,
      isLiveTelegraphEnabled,
      currentHostname: hostname,
      recommendedAction
    };
  }
}

// Auto-enable production mode if not on localhost
if (typeof window !== 'undefined') {
  const hostname = window.location.hostname;
  
  if (hostname !== 'localhost' && !hostname.includes('127.0.0.1')) {
    console.log('🌐 Non-localhost environment detected, enabling production mode');
    ProductionModeForcer.forceProductionMode();
    ProductionModeForcer.enableLiveTelegraph();
  }
}

export default ProductionModeForcer;
