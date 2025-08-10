/**
 * Direct Checkout Service
 * Simplified payment flow that opens Stripe checkout in a new window
 * No modals, loading states, or notifications - just direct checkout
 */

import { supabase } from '@/integrations/supabase/client';
import { FallbackPaymentService } from './fallbackPaymentService';

interface DirectCheckoutOptions {
  type: 'credits' | 'premium';
  credits?: number;
  amount?: number;
  plan?: 'monthly' | 'annual';
  email?: string;
}

interface CheckoutResult {
  success: boolean;
  error?: string;
}

class DirectCheckoutService {
  
  /**
   * Open Stripe checkout directly in a new window
   * No loading states, no modals, no notifications
   */
  static async openCheckout(options: DirectCheckoutOptions): Promise<CheckoutResult> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      let checkoutUrl: string;
      
      if (options.type === 'credits') {
        checkoutUrl = await this.createCreditsCheckout(options, user);
      } else {
        checkoutUrl = await this.createPremiumCheckout(options, user);
      }
      
      // Open checkout in new window immediately
      const checkoutWindow = window.open(
        checkoutUrl,
        'stripe-checkout',
        'width=800,height=600,scrollbars=yes,resizable=yes,location=yes,status=yes'
      );
      
      if (!checkoutWindow) {
        // If popup blocked, redirect current window
        window.location.href = checkoutUrl;
      }
      
      return { success: true };
      
    } catch (error: any) {
      console.error('Direct checkout failed:', error);

      // Try fallback payment service
      try {
        console.log('🔄 Attempting fallback payment...');
        await FallbackPaymentService.openPayment(options);
        return { success: true };
      } catch (fallbackError) {
        console.error('Fallback payment also failed:', fallbackError);
        return {
          success: false,
          error: error.message || 'Checkout failed'
        };
      }
    }
  }
  
  /**
   * Create credits checkout session
   */
  private static async createCreditsCheckout(
    options: DirectCheckoutOptions, 
    user: any
  ): Promise<string> {
    const credits = options.credits || 50;
    const amount = options.amount || this.getCreditsPrice(credits);
    
    const response = await fetch('/.netlify/functions/create-payment', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        amount,
        credits,
        isGuest: !user,
        guestEmail: options.email || user?.email,
        successUrl: `${window.location.origin}/payment-success?type=credits&credits=${credits}`,
        cancelUrl: `${window.location.origin}${window.location.pathname}`
      })
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('Credits checkout failed:', {
        status: response.status,
        statusText: response.statusText,
        error: errorText
      });
      throw new Error(`Failed to create credits checkout session: ${response.status} ${response.statusText} - ${errorText}`);
    }

    const data = await response.json();

    if (!data.url) {
      console.error('No checkout URL in response:', data);
      throw new Error('No checkout URL received from server');
    }
    
    return data.url;
  }
  
  /**
   * Create premium subscription checkout session
   */
  private static async createPremiumCheckout(
    options: DirectCheckoutOptions,
    user: any
  ): Promise<string> {
    const plan = options.plan || 'monthly';
    
    const response = await fetch('/.netlify/functions/create-subscription', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        plan,
        isGuest: !user,
        guestEmail: options.email || user?.email,
        successUrl: `${window.location.origin}/payment-success?type=premium&plan=${plan}`,
        cancelUrl: `${window.location.origin}${window.location.pathname}`
      })
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('Premium checkout failed:', {
        status: response.status,
        statusText: response.statusText,
        error: errorText
      });
      throw new Error(`Failed to create premium checkout session: ${response.status} ${response.statusText} - ${errorText}`);
    }

    const data = await response.json();

    if (!data.url) {
      console.error('No checkout URL in response:', data);
      throw new Error('No checkout URL received from server');
    }
    
    return data.url;
  }
  
  /**
   * Get price for credits (simplified pricing)
   */
  private static getCreditsPrice(credits: number): number {
    if (credits <= 50) return 19;
    if (credits <= 100) return 29;
    if (credits <= 250) return 49;
    if (credits <= 500) return 79;
    return 99;
  }
  
  /**
   * Quick buy credits - most common amounts
   */
  static async buyCredits(credits: 50 | 100 | 250 | 500 = 50): Promise<CheckoutResult> {
    return this.openCheckout({
      type: 'credits',
      credits
    });
  }
  
  /**
   * Quick upgrade to premium
   */
  static async upgradeToPremium(plan: 'monthly' | 'annual' = 'monthly'): Promise<CheckoutResult> {
    return this.openCheckout({
      type: 'premium',
      plan
    });
  }
}

export default DirectCheckoutService;
export { DirectCheckoutService };
