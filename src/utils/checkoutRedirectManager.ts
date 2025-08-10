/**
 * Checkout Redirect Manager
 * Handles Stripe checkout redirects while preserving user gesture context
 * to prevent popup blockers and ensure reliable checkout flow
 */

import { PopupBlockerDetection } from './popupBlockerDetection';

export interface CheckoutRedirectOptions {
  preferNewWindow?: boolean;
  windowFeatures?: string;
  fallbackToCurrentWindow?: boolean;
  onPopupBlocked?: () => void;
  onRedirectSuccess?: () => void;
  onRedirectError?: (error: Error) => void;
}

export interface CheckoutSession {
  sessionId: string;
  checkoutUrl?: string;
  isReady: boolean;
  windowReference?: Window | null;
}

export class CheckoutRedirectManager {
  private static sessions = new Map<string, CheckoutSession>();

  /**
   * Create a checkout session and immediately open a window (preserving user gesture)
   * The window will initially show a loading state, then redirect to Stripe when ready
   */
  static createCheckoutSession(
    sessionId: string, 
    options: CheckoutRedirectOptions = {}
  ): CheckoutSession {
    const {
      preferNewWindow = true,
      windowFeatures = 'width=800,height=600,scrollbars=yes,resizable=yes,location=yes,status=yes',
      fallbackToCurrentWindow = true,
      onPopupBlocked,
      onRedirectSuccess,
      onRedirectError
    } = options;

    // Create loading page URL
    const loadingUrl = `${window.location.origin}/checkout-loading?session=${sessionId}`;
    
    let windowReference: Window | null = null;

    if (preferNewWindow) {
      // Use intelligent popup detection for better success rate
      const strategy = PopupBlockerDetection.getRecommendedStrategy();

      if (strategy === 'current-window') {
        console.log('Popup blockers likely - will use current window for checkout');
        windowReference = null;
        onRedirectSuccess?.();
      } else {
        try {
          // Immediately open window with loading page to preserve user gesture
          windowReference = window.open(loadingUrl, 'stripe-checkout', windowFeatures);

          if (!windowReference) {
            // Popup was blocked
            console.warn('Popup blocked for checkout session:', sessionId);
            onPopupBlocked?.();

            if (fallbackToCurrentWindow) {
              // Will redirect current window when checkout URL is ready
              windowReference = null;
            } else {
              throw new Error('Popup blocked and fallback disabled');
            }
          } else {
            console.log('Checkout window opened successfully:', sessionId);
            onRedirectSuccess?.();
          }
        } catch (error) {
          console.error('Failed to open checkout window:', error);
          onRedirectError?.(error as Error);
          windowReference = null;
        }
      }
    }

    const session: CheckoutSession = {
      sessionId,
      isReady: false,
      windowReference
    };

    this.sessions.set(sessionId, session);
    return session;
  }

  /**
   * Update the checkout session with the actual Stripe URL and redirect
   */
  static updateCheckoutUrl(sessionId: string, checkoutUrl: string): boolean {
    const session = this.sessions.get(sessionId);
    if (!session) {
      console.error('Checkout session not found:', sessionId);
      return false;
    }

    session.checkoutUrl = checkoutUrl;
    session.isReady = true;

    try {
      if (session.windowReference && !session.windowReference.closed) {
        // Update the existing window with the Stripe URL
        session.windowReference.location.href = checkoutUrl;
        console.log('Redirected existing window to Stripe:', checkoutUrl);
        return true;
      } else if (!session.windowReference) {
        // Fallback to current window
        window.location.href = checkoutUrl;
        console.log('Redirected current window to Stripe:', checkoutUrl);
        return true;
      } else {
        // Window was closed, try to open a new one
        console.warn('Original checkout window was closed, opening new one');
        const newWindow = window.open(checkoutUrl, 'stripe-checkout-retry');
        if (newWindow) {
          session.windowReference = newWindow;
          return true;
        } else {
          // Popup blocked on retry, use current window
          window.location.href = checkoutUrl;
          return true;
        }
      }
    } catch (error) {
      console.error('Failed to redirect to checkout URL:', error);
      
      // Final fallback: redirect current window
      try {
        window.location.href = checkoutUrl;
        return true;
      } catch (finalError) {
        console.error('Final fallback failed:', finalError);
        return false;
      }
    }
  }

  /**
   * Handle checkout completion or cancellation
   */
  static completeCheckout(sessionId: string): void {
    const session = this.sessions.get(sessionId);
    if (session) {
      // Close the checkout window if it exists and is not the current window
      if (session.windowReference && session.windowReference !== window) {
        try {
          session.windowReference.close();
        } catch (error) {
          console.warn('Could not close checkout window:', error);
        }
      }
      
      this.sessions.delete(sessionId);
      console.log('Checkout session completed:', sessionId);
    }
  }

  /**
   * Clean up expired or abandoned sessions
   */
  static cleanupSessions(): void {
    for (const [sessionId, session] of this.sessions.entries()) {
      if (session.windowReference && session.windowReference.closed) {
        this.sessions.delete(sessionId);
        console.log('Cleaned up closed checkout session:', sessionId);
      }
    }
  }

  /**
   * Get session status
   */
  static getSession(sessionId: string): CheckoutSession | undefined {
    return this.sessions.get(sessionId);
  }

  /**
   * Legacy support: Direct redirect with popup blocker detection
   */
  static directRedirect(
    url: string, 
    options: CheckoutRedirectOptions = {}
  ): boolean {
    const {
      preferNewWindow = true,
      windowFeatures = 'width=800,height=600,scrollbars=yes,resizable=yes',
      fallbackToCurrentWindow = true,
      onPopupBlocked,
      onRedirectSuccess,
      onRedirectError
    } = options;

    if (preferNewWindow) {
      try {
        const checkoutWindow = window.open(url, 'stripe-checkout', windowFeatures);
        
        if (checkoutWindow) {
          onRedirectSuccess?.();
          return true;
        } else {
          onPopupBlocked?.();
          
          if (fallbackToCurrentWindow) {
            window.location.href = url;
            return true;
          }
          return false;
        }
      } catch (error) {
        onRedirectError?.(error as Error);
        
        if (fallbackToCurrentWindow) {
          window.location.href = url;
          return true;
        }
        return false;
      }
    } else {
      window.location.href = url;
      return true;
    }
  }
}

// Auto-cleanup every 5 minutes
if (typeof window !== 'undefined') {
  setInterval(() => {
    CheckoutRedirectManager.cleanupSessions();
  }, 5 * 60 * 1000);
}
