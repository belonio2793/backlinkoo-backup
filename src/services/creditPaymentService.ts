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

    return {
      isLocalhost,
      isNetlify,
      isFlyDev,
      isDevelopment: isLocalhost,
      isProduction: !isLocalhost,
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
   * Create credit payment session using Supabase Edge Functions
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

    try {
      console.log('🔄 Using Supabase Edge Function for credit payment...');

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

      const { data, error } = await supabase.functions.invoke('create-payment', {
        body: requestBody,
        headers
      });

      console.log('📥 Supabase Edge Function response:', {
        hasData: !!data,
        hasError: !!error,
        error: error,
        errorMessage: error?.message,
        dataKeys: data ? Object.keys(data) : [],
        hasUrl: data && !!data.url
      });

      if (error) {
        console.error('❌ Supabase Edge Function error:', error);
        const errorMessage = this.extractErrorMessage(error);
        return {
          success: false,
          error: `Payment system error: ${errorMessage}`
        };
      }

      if (!data || !data.url) {
        console.error('❌ No checkout URL received from Supabase Edge Function');
        return {
          success: false,
          error: 'Payment system error: No checkout URL received'
        };
      }

      console.log('✅ Credit payment session created successfully');
      return {
        success: true,
        url: data.url,
        sessionId: data.sessionId || data.session_id
      };

    } catch (error: any) {
      console.error('❌ Credit payment creation failed:', error);
      const catchErrorMessage = getErrorMessage(error);
      logFormattedError('Credit payment creation failed', error);
      ErrorLogger.logError('Credit payment error', error);

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
    console.log('🚀 Opening Stripe checkout in new window:', url);
    
    const checkoutWindow = window.open(
      url,
      'stripe-credit-checkout',
      'width=800,height=600,scrollbars=yes,resizable=yes,toolbar=no,menubar=no'
    );

    if (!checkoutWindow) {
      console.log('🚫 Popup blocked, redirecting current window');
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
      // Verify payment status using Netlify function
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
