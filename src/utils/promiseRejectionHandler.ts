/**
 * Promise Rejection Handler
 * Specifically handles unhandled promise rejections to prevent [object Object] errors
 */

import { safeErrorMessage } from './errorDisplayFix';

class PromiseRejectionHandler {
  private static instance: PromiseRejectionHandler;
  private rejectionCounts = new Map<string, number>();
  private readonly MAX_SAME_REJECTION = 5;

  static getInstance(): PromiseRejectionHandler {
    if (!this.instance) {
      this.instance = new PromiseRejectionHandler();
    }
    return this.instance;
  }

  init(): void {
    // Handle unhandled promise rejections
    window.addEventListener('unhandledrejection', (event) => {
      // Prevent the default behavior that shows [object Object]
      event.preventDefault();
      
      const reason = event.reason;
      const rejectionKey = this.getRejectionKey(reason);
      const count = (this.rejectionCounts.get(rejectionKey) || 0) + 1;
      this.rejectionCounts.set(rejectionKey, count);

      // Only log and handle if we haven't seen this too many times
      if (count <= this.MAX_SAME_REJECTION) {
        this.handleRejection(reason, count);
      }
    });

    console.log('🔧 Promise rejection handler initialized');
  }

  private getRejectionKey(reason: any): string {
    try {
      if (typeof reason === 'string') {
        return reason;
      }
      
      if (reason instanceof Error) {
        return `${reason.name}: ${reason.message}`;
      }
      
      if (reason && typeof reason === 'object') {
        // Create a key based on meaningful properties
        const keys = ['message', 'error', 'code', 'status', 'type'];
        const keyParts = keys
          .filter(key => reason[key])
          .map(key => `${key}:${reason[key]}`)
          .slice(0, 2); // Limit to prevent huge keys
        
        if (keyParts.length > 0) {
          return keyParts.join('|');
        }
        
        // Fallback to constructor name if available
        if (reason.constructor && reason.constructor.name !== 'Object') {
          return reason.constructor.name;
        }
      }
      
      return 'unknown-rejection';
    } catch {
      return 'unknown-rejection';
    }
  }

  private handleRejection(reason: any, count: number): void {
    const formattedMessage = safeErrorMessage(reason);
    
    // Categorize the rejection
    if (this.isAuthRelated(reason)) {
      this.handleAuthRejection(reason, formattedMessage, count);
    } else if (this.isNetworkRelated(reason)) {
      this.handleNetworkRejection(reason, formattedMessage, count);
    } else if (this.isDatabaseRelated(reason)) {
      this.handleDatabaseRejection(reason, formattedMessage, count);
    } else if (this.isThirdPartyRelated(reason)) {
      this.handleThirdPartyRejection(reason, formattedMessage, count);
    } else {
      this.handleGenericRejection(reason, formattedMessage, count);
    }
  }

  private isAuthRelated(reason: any): boolean {
    const message = safeErrorMessage(reason).toLowerCase();
    return message.includes('auth') || 
           message.includes('login') || 
           message.includes('permission') ||
           message.includes('unauthorized') ||
           message.includes('forbidden');
  }

  private isNetworkRelated(reason: any): boolean {
    const message = safeErrorMessage(reason).toLowerCase();
    return message.includes('fetch') || 
           message.includes('network') || 
           message.includes('connection') ||
           message.includes('timeout') ||
           (reason && reason.status >= 400 && reason.status < 600);
  }

  private isDatabaseRelated(reason: any): boolean {
    const message = safeErrorMessage(reason).toLowerCase();
    return message.includes('supabase') || 
           message.includes('database') || 
           message.includes('sql') ||
           message.includes('postgres') ||
           message.includes('rls') ||
           message.includes('policy');
  }

  private isThirdPartyRelated(reason: any): boolean {
    const message = safeErrorMessage(reason).toLowerCase();
    const stack = reason instanceof Error ? reason.stack?.toLowerCase() || '' : '';
    
    const thirdPartyIndicators = [
      'chrome-extension',
      'moz-extension',
      'fullstory',
      'analytics',
      'gtm',
      'facebook',
      'google',
      'metamask',
      'wallet'
    ];

    return thirdPartyIndicators.some(indicator => 
      message.includes(indicator) || stack.includes(indicator)
    );
  }

  private handleAuthRejection(reason: any, message: string, count: number): void {
    console.warn(`🔐 Auth-related promise rejection (${count}):`, message);
    if (count === 1) {
      console.log('💡 This may be related to authentication state changes and can usually be ignored.');
    }
  }

  private handleNetworkRejection(reason: any, message: string, count: number): void {
    console.warn(`🌐 Network-related promise rejection (${count}):`, message);
    if (count === 1) {
      console.log('💡 This may be due to network connectivity or server issues.');
    }
  }

  private handleDatabaseRejection(reason: any, message: string, count: number): void {
    console.warn(`🗄️ Database-related promise rejection (${count}):`, message);
    if (count === 1) {
      console.log('💡 This may be related to database permissions or RLS policies.');
    }
  }

  private handleThirdPartyRejection(reason: any, message: string, count: number): void {
    console.warn(`🔌 Third-party-related promise rejection (${count}):`, message);
    if (count === 1) {
      console.log('💡 This is likely caused by browser extensions or external scripts and can be ignored.');
    }
  }

  private handleGenericRejection(reason: any, message: string, count: number): void {
    console.error(`🚨 Unhandled promise rejection (${count}):`, message);
    
    // Log additional details for debugging
    if (count === 1 && reason && typeof reason === 'object') {
      console.group('🔍 Rejection details:');
      console.log('Type:', typeof reason);
      console.log('Constructor:', reason.constructor?.name || 'unknown');
      console.log('Original object:', reason);
      
      if (reason instanceof Error) {
        console.log('Stack:', reason.stack);
      }
      
      console.groupEnd();
    }
  }

  /**
   * Clear rejection counts (useful for testing)
   */
  clearRejectionCounts(): void {
    this.rejectionCounts.clear();
  }

  /**
   * Get rejection statistics
   */
  getRejectionStats(): { [key: string]: number } {
    return Object.fromEntries(this.rejectionCounts);
  }
}

// Auto-initialize in browser environment
if (typeof window !== 'undefined') {
  PromiseRejectionHandler.getInstance().init();
}

export { PromiseRejectionHandler };
