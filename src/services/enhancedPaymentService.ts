/**
 * Enhanced Payment Service
 * Handles both mobile and desktop payment flows with comprehensive error handling
 */

import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface PaymentOptions {
  type: 'premium' | 'credits';
  plan?: 'monthly' | 'yearly';
  credits?: number;
  email?: string;
  amount?: number;
}

interface PaymentResult {
  success: boolean;
  url?: string;
  error?: string;
  sessionId?: string;
  usedFallback?: boolean;
}

export class EnhancedPaymentService {
  private static readonly ENDPOINTS = {
    subscription: '/.netlify/functions/create-subscription',
    payment: '/.netlify/functions/create-payment',
    verify: '/.netlify/functions/verify-payment'
  };

  /**
   * Check if we're on a mobile device
   */
  private static isMobile(): boolean {
    if (typeof window === 'undefined') return false;
    
    return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) ||
           window.innerWidth <= 768;
  }

  /**
   * Check if we're on iOS Safari
   */
  private static isIOSSafari(): boolean {
    if (typeof window === 'undefined') return false;
    
    return /iPad|iPhone|iPod/.test(navigator.userAgent) && 
           /Safari/.test(navigator.userAgent) && 
           !/CriOS|FxiOS|OPiOS|mercury/.test(navigator.userAgent);
  }

  /**
   * Get current user safely
   */
  private static async getCurrentUser() {
    try {
      const { data: { user }, error } = await supabase.auth.getUser();
      if (error) {
        console.warn('Auth error:', error);
        return null;
      }
      return user;
    } catch (error) {
      console.warn('Failed to get user:', error);
      return null;
    }
  }

  /**
   * Validate payment inputs
   */
  private static validatePaymentOptions(options: PaymentOptions): { isValid: boolean; error?: string } {
    if (!options.type || !['premium', 'credits'].includes(options.type)) {
      return { isValid: false, error: 'Invalid payment type' };
    }

    if (options.type === 'premium') {
      if (options.plan && !['monthly', 'yearly'].includes(options.plan)) {
        return { isValid: false, error: 'Invalid subscription plan' };
      }
    }

    if (options.type === 'credits') {
      if (!options.credits || options.credits <= 0) {
        return { isValid: false, error: 'Invalid credits amount' };
      }
    }

    return { isValid: true };
  }

  /**
   * Get pricing for credits
   */
  private static getCreditsPrice(credits: number): number {
    if (credits <= 50) return 19;
    if (credits <= 100) return 29;
    if (credits <= 250) return 49;
    if (credits <= 500) return 79;
    return 99;
  }

  /**
   * Create payment session for premium subscription
   */
  private static async createPremiumPayment(options: PaymentOptions): Promise<PaymentResult> {
    const user = await this.getCurrentUser();
    const plan = options.plan || 'monthly';

    console.log('🔄 Creating premium payment:', { plan, user: !!user });

    const requestBody = {
      plan,
      isGuest: !user,
      guestEmail: options.email || user?.email || 'guest@example.com',
      paymentMethod: 'stripe'
    };

    try {
      const response = await fetch(this.ENDPOINTS.subscription, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody)
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Premium payment failed:', {
          status: response.status,
          error: errorText
        });

        // Parse error if JSON
        let errorMessage = 'Failed to create premium subscription';
        try {
          const errorData = JSON.parse(errorText);
          errorMessage = errorData.error || errorMessage;
        } catch {
          errorMessage = errorText || errorMessage;
        }

        return { success: false, error: errorMessage };
      }

      const data = await response.json();

      if (!data.url) {
        return { success: false, error: 'No checkout URL received' };
      }

      return { success: true, url: data.url, sessionId: data.sessionId };

    } catch (error: any) {
      console.error('Premium payment error:', error);
      return { success: false, error: error.message || 'Network error occurred' };
    }
  }

  /**
   * Create payment session for credits
   */
  private static async createCreditsPayment(options: PaymentOptions): Promise<PaymentResult> {
    const user = await this.getCurrentUser();
    const credits = options.credits || 50;
    const amount = options.amount || this.getCreditsPrice(credits);

    console.log('🔄 Creating credits payment:', { credits, amount, user: !!user });

    const requestBody = {
      amount,
      productName: `${credits} Backlink Credits`,
      isGuest: !user,
      guestEmail: options.email || user?.email || 'guest@example.com',
      paymentMethod: 'stripe',
      credits
    };

    try {
      const response = await fetch(this.ENDPOINTS.payment, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody)
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Credits payment failed:', {
          status: response.status,
          error: errorText
        });

        let errorMessage = 'Failed to create credits payment';
        try {
          const errorData = JSON.parse(errorText);
          errorMessage = errorData.error || errorMessage;
        } catch {
          errorMessage = errorText || errorMessage;
        }

        return { success: false, error: errorMessage };
      }

      const data = await response.json();

      if (!data.url) {
        return { success: false, error: 'No checkout URL received' };
      }

      return { success: true, url: data.url, sessionId: data.sessionId };

    } catch (error: any) {
      console.error('Credits payment error:', error);
      return { success: false, error: error.message || 'Network error occurred' };
    }
  }

  /**
   * Handle payment redirect based on device type
   */
  private static handlePaymentRedirect(url: string): void {
    const isMobile = this.isMobile();
    const isIOSSafari = this.isIOSSafari();

    console.log('🔄 Handling payment redirect:', { isMobile, isIOSSafari, url });

    if (isMobile) {
      // On mobile, always redirect in the same window for better UX
      console.log('📱 Mobile redirect: same window');
      window.location.href = url;
    } else {
      // On desktop, try to open in new window
      console.log('🖥️ Desktop redirect: new window');
      const newWindow = window.open(
        url,
        'stripe-checkout',
        'width=800,height=700,scrollbars=yes,resizable=yes,toolbar=no,menubar=no,location=yes,status=yes'
      );

      if (!newWindow || newWindow.closed || typeof newWindow.closed === 'undefined') {
        console.log('🚫 Popup blocked, redirecting same window');
        window.location.href = url;
      } else {
        console.log('✅ New window opened successfully');
        
        // Monitor the new window
        const checkClosed = setInterval(() => {
          if (newWindow.closed) {
            clearInterval(checkClosed);
            console.log('💳 Payment window closed');
            // Could trigger a payment verification here
          }
        }, 1000);
      }
    }
  }

  /**
   * Fallback payment method for when primary methods fail
   */
  private static async fallbackPayment(options: PaymentOptions): Promise<PaymentResult> {
    console.log('🔄 Using fallback payment method');
    
    // For now, redirect to a hosted pricing page
    const fallbackUrl = options.type === 'premium' 
      ? 'https://buy.stripe.com/premium' // Replace with actual hosted page
      : 'https://buy.stripe.com/credits'; // Replace with actual hosted page

    this.handlePaymentRedirect(fallbackUrl);
    
    return { 
      success: true, 
      url: fallbackUrl, 
      usedFallback: true 
    };
  }

  /**
   * Main payment creation method
   */
  public static async createPayment(options: PaymentOptions): Promise<PaymentResult> {
    console.log('🚀 Enhanced payment service called:', options);

    // Validate options
    const validation = this.validatePaymentOptions(options);
    if (!validation.isValid) {
      return { success: false, error: validation.error };
    }

    try {
      let result: PaymentResult;

      if (options.type === 'premium') {
        result = await this.createPremiumPayment(options);
      } else {
        result = await this.createCreditsPayment(options);
      }

      if (result.success && result.url) {
        // Handle the redirect based on device type
        this.handlePaymentRedirect(result.url);
        return result;
      } else {
        // Try fallback method
        console.log('⚠️ Primary payment failed, trying fallback');
        return await this.fallbackPayment(options);
      }

    } catch (error: any) {
      console.error('❌ Enhanced payment service error:', error);
      
      // Try fallback as last resort
      try {
        return await this.fallbackPayment(options);
      } catch (fallbackError) {
        console.error('❌ Fallback also failed:', fallbackError);
        return { 
          success: false, 
          error: error.message || 'Payment system temporarily unavailable' 
        };
      }
    }
  }

  /**
   * Convenience method for premium subscription
   */
  public static async upgradeToPremium(
    plan: 'monthly' | 'yearly' = 'monthly',
    email?: string
  ): Promise<PaymentResult> {
    return this.createPayment({
      type: 'premium',
      plan,
      email
    });
  }

  /**
   * Convenience method for credits purchase
   */
  public static async buyCredits(
    credits: number = 50,
    email?: string
  ): Promise<PaymentResult> {
    return this.createPayment({
      type: 'credits',
      credits,
      email
    });
  }

  /**
   * Verify payment completion
   */
  public static async verifyPayment(
    sessionId: string,
    type: 'payment' | 'subscription' = 'payment'
  ): Promise<{ success: boolean; paid?: boolean; error?: string }> {
    try {
      const response = await fetch(this.ENDPOINTS.verify, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          sessionId,
          type
        })
      });

      if (!response.ok) {
        const errorText = await response.text();
        return { success: false, error: errorText };
      }

      const data = await response.json();
      return { success: true, paid: data.paid || data.subscribed };

    } catch (error: any) {
      console.error('Payment verification error:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Get environment info for debugging
   */
  public static getEnvironmentInfo() {
    return {
      isMobile: this.isMobile(),
      isIOSSafari: this.isIOSSafari(),
      userAgent: typeof window !== 'undefined' ? navigator.userAgent : 'server',
      windowWidth: typeof window !== 'undefined' ? window.innerWidth : 0,
      protocol: typeof window !== 'undefined' ? window.location.protocol : 'unknown',
      hostname: typeof window !== 'undefined' ? window.location.hostname : 'unknown'
    };
  }
}

export default EnhancedPaymentService;
