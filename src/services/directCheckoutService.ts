/**
 * Direct Checkout Service - Production Ready
 * Direct Stripe checkout integration for backlinkoo.com
 * Uses Supabase Edge Functions
 */

import { supabase } from '@/integrations/supabase/client';

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
   */
  static async openCheckout(options: DirectCheckoutOptions): Promise<CheckoutResult> {
    try {
      console.log('🚀 Opening checkout with options:', options);

      const { data: { user } } = await supabase.auth.getUser();

      let checkoutUrl: string;

      if (options.type === 'credits') {
        checkoutUrl = await this.createCreditsCheckout(options, user);
      } else {
        checkoutUrl = await this.createPremiumCheckout(options, user);
      }

      console.log('✅ Checkout URL created:', checkoutUrl);

      // Open checkout in new window immediately
      const checkoutWindow = window.open(
        checkoutUrl,
        'stripe-checkout',
        'width=800,height=600,scrollbars=yes,resizable=yes,location=yes,status=yes'
      );

      if (!checkoutWindow) {
        console.log('🚫 Popup blocked, redirecting current window');
        // If popup blocked, redirect current window
        window.location.href = checkoutUrl;
      } else {
        console.log('🆕 New window opened successfully');
      }

      return { success: true };

    } catch (error: any) {
      console.error('❌ Direct checkout failed:', error);
      return {
        success: false,
        error: error.message || 'Checkout failed'
      };
    }
  }
  
  /**
   * Create credits checkout session using Supabase Edge Functions
   */
  private static async createCreditsCheckout(
    options: DirectCheckoutOptions, 
    user: any
  ): Promise<string> {
    const credits = options.credits || 50;
    const amount = options.amount || this.getCreditsPrice(credits);
    
    console.log('💳 Creating credits checkout via Supabase Edge Function');
    
    const { data, error } = await supabase.functions.invoke('create-payment', {
      body: {
        amount,
        credits,
        paymentMethod: 'stripe',
        productName: `${credits} Backlink Credits`,
        isGuest: !user,
        guestEmail: !user ? (options.email || 'guest@example.com') : undefined,
        successUrl: `${window.location.origin}/payment-success?type=credits&credits=${credits}`,
        cancelUrl: `${window.location.origin}${window.location.pathname}`
      }
    });
    
    if (error) {
      console.error('❌ Credits checkout failed:', error);
      throw new Error(`Failed to create credits checkout session: ${error.message || JSON.stringify(error)}`);
    }

    if (!data || !data.url) {
      console.error('❌ No checkout URL in response:', data);
      throw new Error('No checkout URL received from server');
    }
    
    console.log('✅ Credits checkout URL created successfully');
    return data.url;
  }
  
  /**
   * Create premium subscription checkout session using Supabase Edge Functions
   */
  private static async createPremiumCheckout(
    options: DirectCheckoutOptions,
    user: any
  ): Promise<string> {
    // Convert 'annual' to 'yearly' for function compatibility
    const plan = options.plan === 'annual' ? 'yearly' : (options.plan || 'monthly');

    console.log('💳 Creating premium checkout via Supabase Edge Function for plan:', plan);
    console.log('👤 User:', user ? 'authenticated' : 'guest');

    const requestBody = {
      plan,
      isGuest: !user,
      guestEmail: options.email || user?.email || 'guest@example.com',
      successUrl: `${window.location.origin}/payment-success?type=premium&plan=${plan}`,
      cancelUrl: `${window.location.origin}${window.location.pathname}`
    };

    console.log('📤 Request body:', requestBody);

    const { data, error } = await supabase.functions.invoke('create-subscription', {
      body: requestBody
    });

    if (error) {
      console.error('❌ Premium checkout failed:', error);
      throw new Error(`Failed to create premium checkout session: ${error.message || JSON.stringify(error)}`);
    }

    if (!data || !data.url) {
      console.error('❌ No checkout URL in response:', data);
      throw new Error('No checkout URL received from server');
    }

    console.log('✅ Premium checkout URL created successfully');
    return data.url;
  }
  
  /**
   * Get price for credits (simplified pricing)
   */
  private static getCreditsPrice(credits: number): number {
    if (credits <= 50) return 70;
    if (credits <= 100) return 140;
    if (credits <= 250) return 350;
    if (credits <= 500) return 700;
    return credits * 1.40; // $1.40 per credit default
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
