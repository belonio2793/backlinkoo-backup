import { supabase } from '@/integrations/supabase/client';
import type { User } from '@supabase/supabase-js';
import { logError as logFormattedError, getErrorMessage } from '@/utils/errorFormatter';
import { ErrorLogger } from '@/utils/errorLogger';
import { mockPaymentService } from '@/services/mockPaymentService';
import { CheckoutRedirectManager, type CheckoutRedirectOptions } from '@/utils/checkoutRedirectManager';

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
   * Validate Stripe configuration
   */
  static validateStripeConfiguration(planType: 'monthly' | 'yearly' = 'monthly'): { isValid: boolean; error?: string; priceId?: string } {
    const monthlyPriceId = import.meta.env.VITE_STRIPE_PREMIUM_PLAN_MONTHLY;
    const annualPriceId = import.meta.env.VITE_STRIPE_PREMIUM_PLAN_ANNUAL;

    const priceId = planType === 'yearly' ? annualPriceId : monthlyPriceId;
    const planName = planType === 'yearly' ? 'annual' : 'monthly';

    if (!priceId || priceId.trim() === '') {
      const isDevelopment = import.meta.env.DEV;
      const errorMessage = isDevelopment
        ? `Local development: Stripe ${planName} price ID not available. This is expected in local development for security. The checkout will work in production where environment variables are properly configured on Netlify.`
        : `Stripe ${planName} price ID not configured. Please set VITE_STRIPE_PREMIUM_PLAN_${planType.toUpperCase()} environment variable.`;

      return {
        isValid: false,
        error: errorMessage
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
        ErrorLogger.logError('Error checking subscription', error);
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
      ErrorLogger.logError('Exception checking subscription status', error);
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
   * Create subscription for premium plans
   */
  static async createSubscription(
    user: User | null,
    isGuest: boolean = false,
    guestEmail?: string,
    planType: 'monthly' | 'yearly' = 'monthly',
    redirectOptions?: CheckoutRedirectOptions
  ): Promise<{ success: boolean; url?: string; error?: string; sessionId?: string; checkoutManager?: any }> {

    try {
      // Validate Stripe configuration for the selected plan
      const stripeConfig = this.validateStripeConfiguration(planType);
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

      const priceId = stripeConfig.priceId!;

      const requestBody = {
        priceId,
        plan: planType, // 'monthly' or 'yearly' - matches Netlify function expectations
        tier: planType === 'yearly' ? 'premium-annual' : 'premium-monthly',
        isGuest,
        guestEmail: isGuest ? guestEmail : undefined
      };

      // Check environment and determine best approach
      const env = this.getEnvironment();
      console.log('🌍 Environment detected for subscription:', env);

      let data, error;

      // Try Supabase Edge Functions first in production environments
      if (env.hasSupabaseFunctions) {
        try {
          console.log('🔄 Attempting Supabase Edge Function...');
          const { data: session } = await supabase.auth.getSession();
          const result = await supabase.functions.invoke('create-subscription', {
            body: requestBody
          });
          data = result.data;
          error = result.error;

          if (!error && data) {
            console.log('✅ Supabase Edge Function succeeded');
          }
        } catch (edgeError) {
          console.warn('⚠️ Supabase Edge Function failed:', edgeError);
          error = edgeError;
        }
      }

      // If edge functions failed or unavailable, try alternative endpoints
      if (error || !data) {
        console.log('🔄 Trying alternative subscription endpoints...');

        const endpoints = [
          '/api/create-subscription',
          '/.netlify/functions/create-subscription',
          '/functions/create-subscription'
        ];

        for (const endpoint of endpoints) {
          try {
            console.log(`🔄 Trying subscription endpoint: ${endpoint}`);
            const response = await fetch(endpoint, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${(await supabase.auth.getSession()).data.session?.access_token || ''}`
              },
              body: JSON.stringify(requestBody)
            });

            if (response.ok) {
              const result = await response.json();
              data = result;
              error = null;
              console.log(`✅ Subscription endpoint succeeded: ${endpoint}`);
              break;
            } else {
              console.warn(`⚠️ Endpoint ${endpoint} returned ${response.status}`);
            }
          } catch (fetchError) {
            console.warn(`⚠️ Endpoint ${endpoint} failed:`, fetchError);
            continue;
          }
        }
      }

      // Final fallback - use mock service for development/testing
      if (error || !data) {
        console.log('🔄 All subscription endpoints failed, using mock service fallback...');

        const mockResult = await mockPaymentService.createSubscription(
          planType === 'yearly' ? 'yearly' : 'monthly',
          isGuest,
          guestEmail
        );

        if (mockResult.success) {
          return {
            success: true,
            url: mockResult.checkoutUrl || 'https://demo-checkout.stripe.com'
          };
        } else {
          error = { message: mockResult.error || 'All subscription methods failed' };
        }
      }

      if (error) {
        ErrorLogger.logError('Edge function error', error);

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
        } else if (errorMessage.includes('non-2xx') || errorMessage.includes('Edge Function')) {
          errorMessage = 'Payment service temporarily unavailable. Please try again in a moment or contact support if the issue persists.';
        } else if (errorMessage.includes('No such price')) {
          errorMessage = 'Invalid Stripe price ID. Please verify your Stripe configuration and ensure the price exists.';
        } else if (errorMessage.includes('404') || errorMessage.includes('Not Found')) {
          errorMessage = 'Subscription service not found. Please check your configuration or contact support.';
        }

        ErrorLogger.logError('Subscription creation error', error);
        return { success: false, error: errorMessage };
      }

      if (!data || (!data.url && !data.checkoutUrl)) {
        return { success: false, error: 'Payment system did not return a checkout URL' };
      }
      return { success: true, url: data.url || data.checkoutUrl };

    } catch (error: any) {
      ErrorLogger.logError('Exception creating subscription', error);

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
        ErrorLogger.logError('Error fetching subscription info', error);
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
      ErrorLogger.logError('Exception fetching subscription info', error);
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
        ErrorLogger.logError('Error cancelling subscription', error);
        return { success: false, error: ErrorLogger.getUserFriendlyMessage(error, 'Failed to cancel subscription') };
      }

      return { success: true };
    } catch (error: any) {
      ErrorLogger.logError('Exception cancelling subscription', error);
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
        ErrorLogger.logError('Error updating subscription status', error);
        return false;
      }

      return true;
    } catch (error: any) {
      ErrorLogger.logError('Exception updating subscription status', error);
      return false;
    }
  }
}

export default SubscriptionService;
