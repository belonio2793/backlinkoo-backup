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

    // Treat fly.dev as development environment (Builder.io development servers)
    const isDevelopment = isLocalhost || isFlyDev;
    const hasSupabaseFunctions = true; // Always try Supabase edge functions first since Stripe keys are configured there

    return {
      isLocalhost,
      isNetlify,
      isFlyDev,
      isDevelopment,
      isProduction: !isDevelopment,
      hasSupabaseFunctions,
      hostname
    };
  }

  /**
   * Extract meaningful error message from any error object
   */
  private static extractErrorMessage(error: unknown): string {
    if (error instanceof Error) {
      return error.message;
    }

    if (typeof error === 'string') {
      return error;
    }

    if (error && typeof error === 'object') {
      const errorObj = error as any;

      // Try multiple common error properties
      const message = errorObj.message ||
                     errorObj.error ||
                     errorObj.details ||
                     errorObj.description ||
                     errorObj.msg ||
                     errorObj.statusText;

      if (message && typeof message === 'string') {
        return message;
      }

      // Create a descriptive message from available properties
      const parts = [];
      if (errorObj.endpoint) parts.push(`Endpoint: ${errorObj.endpoint}`);
      if (errorObj.status) parts.push(`Status: ${errorObj.status}`);
      if (errorObj.type) parts.push(`Type: ${errorObj.type}`);

      if (parts.length > 0) {
        return parts.join(', ');
      }

      // Last resort - try to stringify safely
      try {
        const jsonStr = JSON.stringify(errorObj);
        if (jsonStr && jsonStr !== '{}' && jsonStr.length < 200) {
          return `Error object: ${jsonStr}`;
        }
      } catch {
        // Failed to stringify
      }
    }

    return 'Unknown error (unable to extract details)';
  }

  /**
   * Create development Stripe URL for testing
   */
  private static createDevStripeUrl(options: CreditPaymentOptions): string {
    // Check if we have Stripe test keys for development
    const stripePublishableKey = import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY;

    if (stripePublishableKey && stripePublishableKey.startsWith('pk_test_')) {
      console.log('🧪 Using Stripe test environment for development');
      // Create a mock Stripe checkout page that will open in new window
      const params = new URLSearchParams({
        credits: options.credits.toString(),
        amount: options.amount.toString(),
        productName: options.productName || `${options.credits} Credits`,
        testMode: 'true'
      });

      // Return a local test page that simulates Stripe checkout
      return `/dev-stripe-checkout?${params.toString()}`;
    } else {
      console.log('🔧 No valid Stripe test keys - using local dev checkout');
      const params = new URLSearchParams({
        credits: options.credits.toString(),
        amount: options.amount.toString(),
        productName: options.productName || `${options.credits} Credits`,
        testMode: 'false'
      });
      return `/dev-stripe-checkout?${params.toString()}`;
    }
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

    // Note: Stripe keys are configured in Supabase Edge Functions secrets
    console.log('🔧 Using Supabase Edge Functions for payment processing (Stripe keys configured in Supabase secrets)');

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
        console.log('Environment details:', environment);

        try {
          // Get auth session for Supabase edge functions
          const { data: session } = await supabase.auth.getSession();
          const headers: Record<string, string> = {
            'Content-Type': 'application/json'
          };

          if (!finalIsGuest && session?.session?.access_token) {
            headers['Authorization'] = `Bearer ${session.session.access_token}`;
          }

          console.log('📤 Calling Supabase Edge Function with:', {
            function: 'create-payment',
            hasAuth: !!headers['Authorization'],
            requestBody: { ...requestBody, guestEmail: finalGuestEmail ? '***' : undefined }
          });

          const { data: result, error: edgeError } = await supabase.functions.invoke('create-payment', {
            body: requestBody,
            headers
          });

          console.log('📥 Supabase Edge Function response:', {
            hasData: !!result,
            hasError: !!edgeError,
            error: edgeError,
            errorMessage: edgeError?.message,
            dataKeys: result ? Object.keys(result) : [],
            resultContent: result ? result : 'no data'
          });

          data = result;
          error = edgeError;

          if (!error && data && data.url) {
            console.log('✅ Supabase Edge Function succeeded for credits');
            // Exit early on success
            return {
              success: true,
              url: data.url,
              sessionId: data.sessionId || data.session_id
            };
          } else if (error) {
            console.warn('⚠️ Supabase Edge Function error:', error);
          } else {
            console.warn('⚠️ Supabase Edge Function returned no URL');
          }
        } catch (edgeError) {
          console.warn('⚠️ Supabase Edge Function failed for credits:', edgeError);
          error = edgeError;
        }
      }

      // If edge functions failed, provide better error handling without trying non-existent endpoints
      if (error || !data) {
        console.log('❌ Supabase Edge Function failed, no fallback endpoints available in this deployment');

        // For production environments without alternative endpoints, we should use development fallback
        if (environment.isDevelopment) {
          console.log('🔄 Development environment detected - using dev checkout fallback');
        } else {
          console.error('💥 Production environment - Supabase Edge Function is the only payment method');

          // If we have an error from Supabase Edge Function, use that
          if (error) {
            const supabaseErrorMessage = this.extractErrorMessage(error);
            console.error('💥 Supabase Edge Function error:', supabaseErrorMessage);

            // Return a more specific error based on what we got from Supabase
            return {
              success: false,
              error: `Payment system error: ${supabaseErrorMessage}. Please try again or contact support.`
            };
          } else {
            return {
              success: false,
              error: 'Payment system is temporarily unavailable. Please try again in a moment or contact support.'
            };
          }
        }
      }

      // Final fallback - use development mode credits
      if (error || !data) {
        console.log('🔄 All credit payment endpoints failed, using development fallback...');
        console.log('🌍 Environment check:', {
          isLocalhost: environment.isLocalhost,
          hostname: environment.hostname,
          shouldUseFallback: environment.isLocalhost || environment.hostname.includes('localhost')
        });

        if (environment.isDevelopment) {
          console.log('🏠 Development environment detected - creating Stripe test checkout');

          // For development, create a real Stripe test checkout URL
          const testCheckoutUrl = this.createDevStripeUrl(options);

          return {
            success: true,
            usedFallback: true,
            url: testCheckoutUrl
          };
        } else {
          console.error('💥 Production environment - all payment methods failed');
          const prodErrorMessage = this.extractErrorMessage(error);
          console.error('💥 Last error was:', prodErrorMessage);
          error = {
            message: 'All credit payment methods failed',
            lastError: error,
            environment,
            timestamp: new Date().toISOString()
          };
        }
      }

      if (error) {
        const extractedErrorMessage = this.extractErrorMessage(error);
        console.error('❌ Final payment error:', extractedErrorMessage);
        console.error('❌ Full error object:', error);
        ErrorLogger.logError('Credit payment error', error);

        // Provide more specific error messages based on the error type
        let errorMessage = 'Failed to create credit payment';

        // Handle different error object structures
        if (error && typeof error === 'object') {
          const errorObj = error as any;

          // Check for specific error types first
          if (errorObj.status === 404) {
            errorMessage = 'Payment service not found. Please check your configuration.';
          } else if (errorObj.status === 401 || errorObj.status === 403) {
            errorMessage = 'Authentication required. Please sign in and try again.';
          } else if (errorObj.status === 500) {
            errorMessage = 'Server error. Please try again in a moment.';
          } else if (errorObj.body && typeof errorObj.body === 'string') {
            try {
              const parsed = JSON.parse(errorObj.body);
              errorMessage = parsed.error || parsed.message || errorMessage;
            } catch {
              errorMessage = errorObj.body;
            }
          } else if (errorObj.error && typeof errorObj.error === 'string') {
            errorMessage = errorObj.error;
          } else if (errorObj.message && typeof errorObj.message === 'string') {
            errorMessage = errorObj.message;
          } else if (errorObj.details) {
            errorMessage = errorObj.details;
          } else if (errorObj.msg) {
            errorMessage = errorObj.msg;
          } else {
            // Try to extract meaningful info from the error
            const errorInfo = [
              errorObj.endpoint && `Endpoint: ${errorObj.endpoint}`,
              errorObj.status && `Status: ${errorObj.status}`,
              errorObj.type && `Type: ${errorObj.type}`
            ].filter(Boolean).join(', ');

            errorMessage = errorInfo ?
              `Payment service error (${errorInfo})` :
              'Payment service temporarily unavailable';
          }
        } else if (typeof error === 'string') {
          errorMessage = error;
        }

        // Handle specific error cases with user-friendly messages
        if (errorMessage.includes('Rate limit') || errorMessage.includes('429')) {
          errorMessage = 'Too many requests. Please wait a moment and try again.';
        } else if (errorMessage.includes('Authentication') || errorMessage.includes('auth') || errorMessage.includes('401')) {
          errorMessage = 'Please sign in to your account and try again.';
        } else if (errorMessage.includes('network') || errorMessage.includes('Network') || errorMessage.includes('fetch')) {
          errorMessage = 'Network error. Please check your connection and try again.';
        } else if (errorMessage.includes('configuration') || errorMessage.includes('not configured') || errorMessage.includes('404')) {
          errorMessage = 'Payment system configuration error. Please contact support.';
        } else if (errorMessage.includes('STRIPE') || errorMessage.includes('stripe')) {
          errorMessage = 'Payment processor error. Please try again or contact support.';
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
      const catchErrorMessage = getErrorMessage(error);
      logFormattedError('Credit payment creation failed', error);

      return {
        success: false,
        error: `Credit payment failed: ${catchErrorMessage}`
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
