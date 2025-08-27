import { supabase } from '@/integrations/supabase/client';
import type { User } from '@supabase/supabase-js';
import { logError as logFormattedError, getErrorMessage } from '@/utils/errorFormatter';
import { ErrorLogger } from '@/utils/errorLogger';

export interface CreditPaymentOptions {
  amount: number;
  credits: number;
  productName?: string;
  isGuest?: boolean;
  guestEmail?: string;
}

export interface CreditPaymentResult {
  success: boolean;
  url?: string;
  sessionId?: string;
  error?: string;
  usedFallback?: boolean;
}

export class CreditPaymentService {
  /**
   * Detect the current deployment environment
   */
  private static getEnvironment() {
    if (typeof window === 'undefined') return { isProduction: true, hostname: 'server' };

    const hostname = window.location.hostname;
    const isLocalhost = hostname === 'localhost' || hostname === '127.0.0.1';
    const isNetlify = hostname.includes('netlify.app') || hostname.includes('netlify.com');
    const isFlyDev = hostname.includes('fly.dev');
    const hasSupabaseFunctions = !isLocalhost; // Edge functions more likely to work in production

    return {
      isLocalhost,
      isNetlify,
      isFlyDev,
      isProduction: !isLocalhost,
      hasSupabaseFunctions,
      hostname
    };
  }

  /**
   * Create credit payment session
   */
  static async createCreditPayment(
    user: User | null,
    isGuest: boolean = false,
    guestEmail?: string,
    options: CreditPaymentOptions = { amount: 140, credits: 100, productName: '100 Premium Backlink Credits' }
  ): Promise<CreditPaymentResult> {
    const environment = this.getEnvironment();
    console.log('🔧 Credit Payment Environment:', environment);

    // Validate inputs
    if (!options.credits || options.credits <= 0) {
      return { success: false, error: 'Invalid credit amount' };
    }

    if (!options.amount || options.amount <= 0) {
      return { success: false, error: 'Invalid payment amount' };
    }

    // Determine if this should be a guest checkout or authenticated user checkout
    let finalIsGuest = isGuest;
    let finalGuestEmail = guestEmail;

    if (user && user.email) {
      // If we have an authenticated user, use authenticated checkout
      finalIsGuest = false;
      finalGuestEmail = user.email; // Pass email as backup
    } else if (!user && guestEmail) {
      // If no user but we have guest email, use guest checkout
      finalIsGuest = true;
      finalGuestEmail = guestEmail;
    } else {
      // No user and no guest email - error
      return { success: false, error: 'Email is required for payment processing' };
    }

    // Check Stripe configuration
    const stripePublishableKey = import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY;
    if (!stripePublishableKey || !stripePublishableKey.startsWith('pk_')) {
      console.warn('⚠️ Stripe not configured for credit payments');
      return { 
        success: false, 
        error: 'Payment system not configured. Please contact support.' 
      };
    }

    const requestBody = {
      amount: options.amount,
      credits: options.credits,
      productName: options.productName || `${options.credits} Premium Backlink Credits`,
      isGuest: finalIsGuest,
      guestEmail: finalGuestEmail,
      paymentMethod: 'stripe'
    };

    console.log('💳 Creating credit payment with data:', {
      ...requestBody,
      guestEmail: finalGuestEmail ? '***' : undefined,
      user: user ? { id: user.id, email: '***' } : null,
      finalIsGuest
    });

    let data = null;
    let error = null;

    try {
      // Try Supabase Edge Functions first (if available)
      if (environment.hasSupabaseFunctions) {
        console.log('🔄 Trying Supabase Edge Function for credit payment...');
        try {
          // Get auth session for Supabase edge functions
          const { data: session } = await supabase.auth.getSession();
          const headers: Record<string, string> = {};

          if (!finalIsGuest && session?.session?.access_token) {
            headers['Authorization'] = `Bearer ${session.session.access_token}`;
          }

          const { data: result, error: edgeError } = await supabase.functions.invoke('create-payment', {
            body: requestBody,
            headers
          });
          data = result;
          error = edgeError;

          if (!error && data) {
            console.log('✅ Supabase Edge Function succeeded for credits');
          }
        } catch (edgeError) {
          console.warn('⚠️ Supabase Edge Function failed for credits:', edgeError);
          error = edgeError;
        }
      }

      // If edge functions failed or unavailable, try alternative endpoints
      if (error || !data) {
        console.log('🔄 Trying alternative credit payment endpoints...');

        const endpoints = [
          '/api/create-payment',
          '/.netlify/functions/create-payment',
          '/functions/create-payment'
        ];

        for (const endpoint of endpoints) {
          try {
            console.log(`🔄 Trying credit payment endpoint: ${endpoint}`);

            // Prepare headers
            const headers: Record<string, string> = {
              'Content-Type': 'application/json'
            };

            // Add auth header for non-guest users
            if (!finalIsGuest) {
              const { data: session } = await supabase.auth.getSession();
              if (session?.session?.access_token) {
                headers['Authorization'] = `Bearer ${session.session.access_token}`;
              }
            }

            const response = await fetch(endpoint, {
              method: 'POST',
              headers,
              body: JSON.stringify(requestBody)
            });

            if (response.ok) {
              const result = await response.json();
              data = result;
              error = null;
              console.log(`✅ Credit payment endpoint succeeded: ${endpoint}`);
              break;
            } else {
              const errorText = await response.text();
              console.warn(`⚠️ Endpoint ${endpoint} returned ${response.status}: ${errorText}`);
            }
          } catch (fetchError) {
            console.warn(`⚠️ Endpoint ${endpoint} failed:`, fetchError);
            continue;
          }
        }
      }

      // Final fallback - use development mode credits
      if (error || !data) {
        console.log('🔄 All credit payment endpoints failed, using development fallback...');
        
        if (environment.isLocalhost) {
          return {
            success: true,
            usedFallback: true,
            url: `https://demo-stripe-checkout.com/credits/${options.credits}`
          };
        } else {
          error = { message: 'All credit payment methods failed' };
        }
      }

      if (error) {
        ErrorLogger.logError('Credit payment error', error);

        // Provide more specific error messages
        let errorMessage = 'Failed to create credit payment';

        // Handle different error object structures
        if (error && typeof error === 'object') {
          if (error.error && typeof error.error === 'string') {
            errorMessage = error.error;
          } else if (error.message) {
            errorMessage = error.message;
          } else if (error.details) {
            errorMessage = error.details;
          } else if (error.msg) {
            errorMessage = error.msg;
          } else {
            errorMessage = `Credit Payment API Error: ${JSON.stringify(error)}`;
          }
        } else if (typeof error === 'string') {
          errorMessage = error;
        }

        // Handle specific error cases
        if (errorMessage.includes('Rate limit')) {
          errorMessage = 'Too many requests. Please wait a moment and try again.';
        } else if (errorMessage.includes('Authentication') || errorMessage.includes('auth')) {
          errorMessage = 'Authentication required. Please sign in and try again.';
        } else if (errorMessage.includes('network') || errorMessage.includes('Network')) {
          errorMessage = 'Network error. Please check your connection and try again.';
        } else if (errorMessage.includes('configuration') || errorMessage.includes('not configured')) {
          errorMessage = 'Payment system not configured. Please contact support.';
        }

        return { success: false, error: errorMessage };
      }

      if (data && data.url) {
        console.log('✅ Credit payment session created successfully');
        return {
          success: true,
          url: data.url,
          sessionId: data.sessionId || data.session_id
        };
      } else {
        return { 
          success: false, 
          error: 'No payment URL received from server' 
        };
      }

    } catch (error: any) {
      const errorMessage = getErrorMessage(error);
      logFormattedError('Credit payment creation failed', error);
      
      return { 
        success: false, 
        error: `Credit payment failed: ${errorMessage}` 
      };
    }
  }

  /**
   * Open credit payment checkout in new window
   */
  static openCheckoutWindow(url: string, sessionId?: string): void {
    const checkoutWindow = window.open(
      url,
      'stripe-credit-checkout',
      'width=800,height=600,scrollbars=yes,resizable=yes,toolbar=no,menubar=no'
    );

    if (!checkoutWindow) {
      // Fallback to current window if popup blocked
      window.location.href = url;
      return;
    }

    // Monitor window for completion
    this.monitorCheckoutWindow(checkoutWindow, sessionId);
  }

  /**
   * Monitor checkout window for completion
   */
  private static monitorCheckoutWindow(checkoutWindow: Window, sessionId?: string): void {
    const checkInterval = setInterval(() => {
      if (checkoutWindow.closed) {
        clearInterval(checkInterval);
        
        // Check payment status after a short delay
        setTimeout(() => {
          this.handleCheckoutComplete(sessionId);
        }, 1000);
      }
    }, 1000);

    // Auto-cleanup after 30 minutes
    setTimeout(() => {
      clearInterval(checkInterval);
      if (!checkoutWindow.closed) {
        checkoutWindow.close();
      }
    }, 30 * 60 * 1000);
  }

  /**
   * Handle checkout completion
   */
  private static async handleCheckoutComplete(sessionId?: string): Promise<void> {
    if (!sessionId) return;

    try {
      // Verify payment status
      const response = await fetch(`/.netlify/functions/verify-payment?session_id=${sessionId}`);
      
      if (response.ok) {
        const result = await response.json();
        if (result.success) {
          this.showSuccessNotification();
          // Refresh page to show updated credits
          setTimeout(() => window.location.reload(), 2000);
        } else {
          this.showCancelledNotification();
        }
      } else {
        this.showCancelledNotification();
      }
    } catch (error) {
      console.error('Credit payment verification failed:', error);
      this.showCancelledNotification();
    }
  }

  /**
   * Show success notification
   */
  private static showSuccessNotification(): void {
    const message = 'Payment successful! Credits will be added to your account.';

    // Use toast if available
    if (typeof window !== 'undefined' && 'toast' in window) {
      (window as any).toast({
        title: '✅ Credits Purchased!',
        description: message,
        duration: 5000
      });
    } else {
      alert(message);
    }

    // Dispatch custom event
    window.dispatchEvent(new CustomEvent('stripe-credit-payment-success', {
      detail: { type: 'credits', timestamp: Date.now() }
    }));
  }

  /**
   * Show cancelled notification
   */
  private static showCancelledNotification(): void {
    // Use toast if available
    if (typeof window !== 'undefined' && 'toast' in window) {
      (window as any).toast({
        title: 'Payment Cancelled',
        description: 'Your credit purchase was cancelled. No charges were made.',
        variant: 'secondary'
      });
    }

    // Dispatch custom event
    window.dispatchEvent(new CustomEvent('stripe-credit-payment-cancelled'));
  }
}

// Export singleton instance for convenience
export const creditPaymentService = new CreditPaymentService();

// Export default service
export default CreditPaymentService;
