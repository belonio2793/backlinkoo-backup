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
    console.log('🔧 Stripe Configuration Check:', {
      hasPublishableKey: !!stripePublishableKey,
      keyFormat: stripePublishableKey ? stripePublishableKey.substring(0, 8) + '...' : 'missing',
      isValidFormat: stripePublishableKey?.startsWith('pk_')
    });

    if (!stripePublishableKey || !stripePublishableKey.startsWith('pk_')) {
      console.error('❌ Stripe configuration error:', {
        publishableKey: stripePublishableKey ? 'present but invalid format' : 'missing',
        expectedFormat: 'pk_test_... or pk_live_...'
      });
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
            dataKeys: result ? Object.keys(result) : []
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

      // If edge functions failed or unavailable, try alternative endpoints
      if (error || !data) {
        console.log('🔄 Trying alternative credit payment endpoints...');

        // Only use Netlify functions if we're actually on Netlify
        const endpoints = environment.isNetlify
          ? [
              '/api/create-payment',
              '/.netlify/functions/create-payment',
              '/functions/create-payment'
            ]
          : [
              '/api/create-payment',
              '/functions/create-payment'
            ];

        let lastError = null;

        for (const endpoint of endpoints) {
          try {
            console.log(`🔄 Trying credit payment endpoint: ${endpoint}`);
            console.log(`📤 Request body:`, {
              ...requestBody,
              guestEmail: finalGuestEmail ? '***masked***' : undefined
            });

            // Prepare headers
            const headers: Record<string, string> = {
              'Content-Type': 'application/json'
            };

            // Add auth header for non-guest users
            if (!finalIsGuest) {
              const { data: session } = await supabase.auth.getSession();
              if (session?.session?.access_token) {
                headers['Authorization'] = `Bearer ${session.session.access_token}`;
                console.log('🔐 Added authorization header');
              }
            }

            const response = await fetch(endpoint, {
              method: 'POST',
              headers,
              body: JSON.stringify(requestBody)
            });

            console.log(`📥 Response status: ${response.status} ${response.statusText}`);

            if (response.ok) {
              const result = await response.json();
              console.log(`✅ Success response from ${endpoint}:`, {
                hasUrl: !!result.url,
                hasSessionId: !!result.sessionId,
                keys: Object.keys(result)
              });
              data = result;
              error = null;
              break;
            } else {
              const errorText = await response.text();
              lastError = {
                endpoint,
                status: response.status,
                statusText: response.statusText,
                body: errorText
              };
              console.warn(`⚠️ Endpoint ${endpoint} failed:`, lastError);
            }
          } catch (fetchError) {
            lastError = {
              endpoint,
              error: fetchError instanceof Error ? fetchError.message : String(fetchError),
              type: 'fetch_error'
            };
            console.warn(`⚠️ Network error for ${endpoint}:`, lastError);
            continue;
          }
        }

        // If all endpoints failed, use the last error for debugging
        if (!data && lastError) {
          console.error('❌ All payment endpoints failed. Last error:', lastError);
          error = lastError;
        }
      }

      // Final fallback - use development mode credits
      if (error || !data) {
        console.log('🔄 All credit payment endpoints failed, using development fallback...');

        if (environment.isLocalhost) {
          console.log('🏠 Localhost detected - returning demo URL');
          return {
            success: true,
            usedFallback: true,
            url: `https://demo-stripe-checkout.com/credits/${options.credits}`
          };
        } else {
          console.error('💥 Production environment - all payment methods failed');
          error = {
            message: 'All credit payment methods failed',
            lastError: error,
            environment,
            timestamp: new Date().toISOString()
          };
        }
      }

      if (error) {
        console.error('❌ Final payment error:', error);
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
