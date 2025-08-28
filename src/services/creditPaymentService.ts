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
    if (typeof window === 'undefined') return { isProduction: true, hostname: 'server', useSupabase: true };

    const hostname = window.location.hostname;
    const isLocalhost = hostname === 'localhost' || hostname === '127.0.0.1';
    const isNetlify = hostname.includes('netlify.app') || hostname.includes('netlify.com');
    const isFlyDev = hostname.includes('fly.dev');

    // Fly.dev deployments should use Supabase Edge Functions
    // Netlify deployments should use Netlify Functions
    const useSupabase = isFlyDev || isLocalhost || (!isNetlify);
    const isDevelopment = isLocalhost;
    const isProduction = !isDevelopment;

    return {
      isLocalhost,
      isNetlify,
      isFlyDev,
      isDevelopment,
      isProduction,
      useSupabase,
      hostname
    };
  }

  /**
   * Open Stripe checkout in a new window
   */
  static openCheckoutWindow(url: string, sessionId?: string): void {
    try {
      console.log('🚀 Opening checkout window:', url);

      // Open checkout in new window
      const checkoutWindow = window.open(
        url,
        'stripe-checkout',
        'width=600,height=700,scrollbars=yes,resizable=yes'
      );

      if (!checkoutWindow) {
        throw new Error('Popup was blocked by browser. Please allow popups and try again.');
      }

      // Optional: Monitor window close
      const checkClosed = setInterval(() => {
        if (checkoutWindow.closed) {
          clearInterval(checkClosed);
          console.log('🔄 Checkout window closed');
          // Could trigger a payment verification here if needed
        }
      }, 1000);

      // Clean up interval after 30 minutes
      setTimeout(() => {
        clearInterval(checkClosed);
      }, 30 * 60 * 1000);

    } catch (error) {
      console.error('❌ Failed to open checkout window:', error);
      // Fallback: redirect in same window
      window.location.href = url;
    }
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
   * Create credit payment session - Production Ready (Live Payments Only)
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

    // Production payment processing - Using Supabase Edge Functions for Fly.dev deployment
    console.log('🔧 Using Supabase Edge Functions for live payment processing (Fly.dev deployment)');

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
      console.log('🔄 Calling Supabase Edge Function for credit payment...');

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

      if (!response.ok) {
        let errorMessage;
        try {
          // Try to read as JSON first for structured errors
          const errorData = await response.json();
          errorMessage = errorData.error || errorData.message || response.statusText;
        } catch {
          // If JSON parsing fails, fall back to status text
          errorMessage = response.statusText;
        }
        console.error('❌ Netlify Function failed:', response.status, errorMessage);
        throw new Error(`Payment service returned ${response.status}: ${errorMessage}`);
      }

      const result = await response.json();

      console.log('📥 Netlify Function response data:', {
        hasUrl: !!result.url,
        hasSessionId: !!result.sessionId,
        dataKeys: Object.keys(result)
      });

      if (result.url) {
        console.log('✅ Live payment session created successfully');
        return {
          success: true,
          url: result.url,
          sessionId: result.sessionId
        };
      } else {
        throw new Error('No payment URL received from server');
      }

    } catch (error) {
      const extractedErrorMessage = this.extractErrorMessage(error);
      console.error('❌ Credit payment error:', extractedErrorMessage);
      console.error('❌ Full error object:', error);
      ErrorLogger.logError('Credit payment error', error);

      // Provide more specific error messages based on the error type
      let errorMessage = 'Failed to create credit payment';

      if (extractedErrorMessage.includes('network') || extractedErrorMessage.includes('fetch')) {
        errorMessage = 'Network error. Please check your internet connection and try again.';
      } else if (extractedErrorMessage.includes('unauthorized') || extractedErrorMessage.includes('authentication')) {
        errorMessage = 'Authentication error. Please sign in and try again.';
      } else if (extractedErrorMessage.includes('invalid') || extractedErrorMessage.includes('validation')) {
        errorMessage = 'Invalid payment information. Please check your details and try again.';
      } else if (extractedErrorMessage.includes('timeout')) {
        errorMessage = 'Request timeout. Please try again in a moment.';
      } else if (extractedErrorMessage.includes('Edge Function returned a non-2xx status code')) {
        errorMessage = 'Payment service is temporarily unavailable. Please try again in a moment or contact support.';
      } else {
        errorMessage = `Payment error: ${extractedErrorMessage}. Please try again or contact support if the problem persists.`;
      }

      logFormattedError(error, 'CreditPaymentService.createCreditPayment');

      return {
        success: false,
        error: errorMessage
      };
    }
  }
}

export default CreditPaymentService;
