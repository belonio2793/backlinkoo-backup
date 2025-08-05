import { supabase } from '@/integrations/supabase/client';
import type { User } from '@supabase/supabase-js';
import { logError, getErrorMessage } from '@/utils/errorFormatter';

export interface SubscriptionStatus {
  isSubscribed: boolean;
  subscriptionTier: string | null;
  features: {
    keywordResearch: boolean;
    automatedCampaigns: boolean;
    rankTracker: boolean;
    unlimitedAccess: boolean;
  };
  subscriptionEnd?: string;
  stripeCustomerId?: string;
}

export class SubscriptionService {
  /**
   * Validate Stripe configuration
   */
  static validateStripeConfiguration(planType: 'monthly' | 'yearly' = 'monthly'): { isValid: boolean; error?: string; priceId?: string } {
    const monthlyPriceId = import.meta.env.VITE_STRIPE_PREMIUM_PLAN_MONTHLY;
    const annualPriceId = import.meta.env.VITE_STRIPE_PREMIUM_PLAN_ANNUAL;

    const priceId = planType === 'yearly' ? annualPriceId : monthlyPriceId;
    const planName = planType === 'yearly' ? 'annual' : 'monthly';

    if (!priceId || priceId.trim() === '') {
      return {
        isValid: false,
        error: `Stripe ${planName} price ID not configured. Please set VITE_STRIPE_PREMIUM_PLAN_${planType.toUpperCase()} environment variable on Netlify.`
      };
    }

    // Check if using placeholder/test values
    if (priceId.includes('test_placeholder') || priceId === 'price_premium_monthly') {
      return {
        isValid: false,
        error: `Stripe ${planName} plan is configured with placeholder values. Please set up real Stripe price IDs.`
      };
    }

    // Basic format validation for Stripe price IDs
    if (!priceId.startsWith('price_')) {
      return {
        isValid: false,
        error: `Invalid Stripe ${planName} price ID format. Price IDs should start with "price_".`
      };
    }

    return { isValid: true, priceId };
  }

  /**
   * Check if user has active subscription
   */
  static async getSubscriptionStatus(user: User | null): Promise<SubscriptionStatus> {
    if (!user) {
      return {
        isSubscribed: false,
        subscriptionTier: null,
        features: {
          keywordResearch: false,
          automatedCampaigns: false,
          rankTracker: false,
          unlimitedAccess: false,
        }
      };
    }

    try {
      // Check subscribers table for active subscription
      const { data: subscribers, error } = await supabase
        .from('subscribers')
        .select('*')
        .eq('email', user.email)
        .eq('subscribed', true);

      if (error) {
        logError('Error checking subscription', error);
      }

      // Get the most recent active subscriber if multiple exist
      const subscriber = subscribers && subscribers.length > 0
        ? subscribers.sort((a, b) => new Date(b.updated_at || b.created_at || '').getTime() - new Date(a.updated_at || a.created_at || '').getTime())[0]
        : null;

      const isSubscribed = !!subscriber;
      const tier = subscriber?.subscription_tier || null;

      return {
        isSubscribed,
        subscriptionTier: tier,
        features: {
          keywordResearch: isSubscribed,
          automatedCampaigns: isSubscribed,
          rankTracker: isSubscribed,
          unlimitedAccess: isSubscribed,
        },
        stripeCustomerId: subscriber?.stripe_customer_id,
      };
    } catch (error: any) {
      logError('Exception checking subscription status', error);
      return {
        isSubscribed: false,
        subscriptionTier: null,
        features: {
          keywordResearch: false,
          automatedCampaigns: false,
          rankTracker: false,
          unlimitedAccess: false,
        }
      };
    }
  }

  /**
   * Create subscription for $29/month plan
   */
  static async createSubscription(user: User | null, isGuest: boolean = false, guestEmail?: string): Promise<{ success: boolean; url?: string; error?: string }> {

    try {
      // Validate Stripe configuration
      const stripeConfig = this.validateStripeConfiguration();
      if (!stripeConfig.isValid) {
        return {
          success: false,
          error: stripeConfig.error
        };
      }

      // Validate inputs
      if (isGuest && !guestEmail) {
        return { success: false, error: 'Guest email is required for guest checkout' };
      }

      if (!isGuest && !user) {
        return { success: false, error: 'User authentication required' };
      }

      const priceId = import.meta.env.VITE_STRIPE_PRICE_ID;

      const requestBody = {
        priceId,
        tier: 'premium',
        isGuest,
        guestEmail: isGuest ? guestEmail : undefined
      };

      // Get current session to ensure we have auth token
      const { data: session } = await supabase.auth.getSession();

      const { data, error } = await supabase.functions.invoke('create-subscription', {
        body: requestBody
      });

      if (error) {
        console.error('Edge function error:', error);

        // Provide more specific error messages
        let errorMessage = 'Failed to create subscription';

        // Handle different error object structures
        if (error && typeof error === 'object') {
          // Check for nested error structures from edge functions
          if (error.error && typeof error.error === 'string') {
            errorMessage = error.error;
          } else if (error.message) {
            errorMessage = error.message;
          } else if (error.details) {
            errorMessage = error.details;
          } else if (error.msg) {
            errorMessage = error.msg;
          } else {
            // If it's an object but no clear message, stringify it
            errorMessage = `API Error: ${JSON.stringify(error)}`;
          }
        } else if (typeof error === 'string') {
          errorMessage = error;
        }

        // Handle specific error cases
        if (errorMessage.includes('Rate limit')) {
          errorMessage = 'Too many requests. Please wait a moment and try again.';
        } else if (errorMessage.includes('STRIPE_SECRET_KEY') || errorMessage.includes('stripe')) {
          errorMessage = 'Payment system configuration error. Please contact support.';
        } else if (errorMessage.includes('authentication') || errorMessage.includes('auth')) {
          errorMessage = 'Authentication error. Please sign in and try again.';
        } else if (errorMessage.includes('price') || errorMessage.includes('priceId')) {
          errorMessage = 'Invalid pricing configuration. Please contact support.';
        } else if (errorMessage.includes('non-2xx')) {
          errorMessage = 'Server configuration error. The payment system returned an error response. Please verify Stripe webhook configuration.';
        } else if (errorMessage.includes('No such price')) {
          errorMessage = 'Invalid Stripe price ID. Please verify your Stripe configuration and ensure the price exists.';
        }

        logError('Subscription creation error', error);
        return { success: false, error: errorMessage };
      }

      if (!data || !data.url) {
        return { success: false, error: 'Payment system did not return a checkout URL' };
      }
      return { success: true, url: data.url };

    } catch (error: any) {
      console.error('Exception creating subscription:', error);

      let errorMessage = 'An unexpected error occurred';

      if (error.message) {
        errorMessage = error.message;
      }

      // Handle network errors
      if (error.name === 'TypeError' || errorMessage.includes('fetch')) {
        errorMessage = 'Network error. Please check your connection and try again.';
      }

      return { success: false, error: errorMessage };
    }
  }

  /**
   * Check if user has access to specific feature
   */
  static async hasFeatureAccess(user: User | null, feature: keyof SubscriptionStatus['features']): Promise<boolean> {
    const status = await this.getSubscriptionStatus(user);
    return status.features[feature];
  }

  /**
   * Get subscription info for display
   */
  static async getSubscriptionInfo(user: User | null) {
    if (!user) return null;

    try {
      const { data: subscribers, error } = await supabase
        .from('subscribers')
        .select('*')
        .eq('email', user.email);

      if (error) {
        logError('Error fetching subscription info', error);
        return null;
      }

      // Get the most recent subscriber if multiple exist
      const subscriber = subscribers && subscribers.length > 0
        ? subscribers.sort((a, b) => new Date(b.updated_at || b.created_at || '').getTime() - new Date(a.updated_at || a.created_at || '').getTime())[0]
        : null;

      return {
        plan: "Premium SEO Tools",
        price: "$29.00",
        billing: "Monthly",
        nextBillingDate: "March 15, 2024", // This would come from Stripe webhook
        email: user.email,
        status: subscriber?.subscribed ? "Active" : "Inactive",
        stripeCustomerId: subscriber?.stripe_customer_id,
        features: [
          "Unlimited keyword research",
          "Advanced SERP analysis", 
          "Automated campaign management",
          "Real-time rank tracking",
          "Priority support",
          "Export capabilities"
        ]
      };
    } catch (error: any) {
      logError('Exception fetching subscription info', error);
      return null;
    }
  }

  /**
   * Cancel subscription (would call Stripe API in production)
   */
  static async cancelSubscription(user: User | null): Promise<{ success: boolean; error?: string }> {
    if (!user) {
      return { success: false, error: 'User not authenticated' };
    }

    try {
      // In production, this would call Stripe API to cancel subscription
      // For now, we'll just update the local record
      const { error } = await supabase
        .from('subscribers')
        .update({
          subscribed: false,
          updated_at: new Date().toISOString()
        })
        .eq('email', user.email)
        .eq('subscribed', true);

      if (error) {
        logError('Error cancelling subscription', error);
        return { success: false, error: getErrorMessage(error) || 'Failed to cancel subscription' };
      }

      return { success: true };
    } catch (error: any) {
      console.error('Exception cancelling subscription:', error);
      return { success: false, error: error.message || 'Failed to cancel subscription' };
    }
  }

  /**
   * Update subscription status from webhook (called by Stripe webhooks)
   */
  static async updateSubscriptionStatus(email: string, subscribed: boolean, stripeCustomerId?: string) {
    try {
      const updateData: any = {
        subscribed,
        updated_at: new Date().toISOString()
      };

      if (stripeCustomerId) {
        updateData.stripe_customer_id = stripeCustomerId;
      }

      let query = supabase
        .from('subscribers')
        .update(updateData)
        .eq('email', email);

      // If we have a stripe customer ID, be more specific
      if (stripeCustomerId) {
        query = query.eq('stripe_customer_id', stripeCustomerId);
      }

      const { error } = await query;

      if (error) {
        logError('Error updating subscription status', error);
        return false;
      }

      return true;
    } catch (error: any) {
      logError('Exception updating subscription status', error);
      return false;
    }
  }
}

export default SubscriptionService;
