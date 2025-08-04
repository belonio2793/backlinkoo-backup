import { supabase } from '@/integrations/supabase/client';
import { userService } from './userService';

export interface UpgradeIntent {
  plan: 'monthly' | 'yearly';
  timestamp: number;
  redirectUrl: string;
  sourceContext?: string; // e.g., 'blog-post', 'seo-analysis', 'dashboard'
}

export class PremiumUpgradeService {
  private static readonly INTENT_KEY = 'premium_checkout_intent';
  private static readonly INTENT_EXPIRY = 60 * 60 * 1000; // 1 hour

  /**
   * Store user's upgrade intent for continuation after auth
   */
  static storeUpgradeIntent(intent: Omit<UpgradeIntent, 'timestamp'>): void {
    const upgradeIntent: UpgradeIntent = {
      ...intent,
      timestamp: Date.now()
    };
    
    localStorage.setItem(this.INTENT_KEY, JSON.stringify(upgradeIntent));
    console.log('📝 Stored upgrade intent:', upgradeIntent);
  }

  /**
   * Retrieve and validate stored upgrade intent
   */
  static getUpgradeIntent(): UpgradeIntent | null {
    try {
      const stored = localStorage.getItem(this.INTENT_KEY);
      if (!stored) return null;

      const intent: UpgradeIntent = JSON.parse(stored);
      
      // Check if intent has expired
      if (Date.now() - intent.timestamp > this.INTENT_EXPIRY) {
        console.log('⏰ Upgrade intent expired, removing...');
        this.clearUpgradeIntent();
        return null;
      }

      return intent;
    } catch (error) {
      console.error('❌ Error retrieving upgrade intent:', error);
      this.clearUpgradeIntent();
      return null;
    }
  }

  /**
   * Clear stored upgrade intent
   */
  static clearUpgradeIntent(): void {
    localStorage.removeItem(this.INTENT_KEY);
    console.log('🧹 Cleared upgrade intent');
  }

  /**
   * Handle successful payment/upgrade
   */
  static async handleUpgradeSuccess(user: any): Promise<{
    success: boolean;
    redirectUrl?: string;
    error?: string;
  }> {
    try {
      console.log('🎉 Processing upgrade success for user:', user?.email);

      // Get the stored intent
      const intent = this.getUpgradeIntent();
      
      // Ensure user is upgraded in our system
      const upgradeResult = await userService.upgradeToPremium();
      
      if (!upgradeResult.success) {
        return {
          success: false,
          error: upgradeResult.message || 'Failed to upgrade user profile'
        };
      }

      // Clear the intent since we're processing it
      this.clearUpgradeIntent();

      // Return redirect URL from intent or default
      const redirectUrl = intent?.redirectUrl || '/dashboard';
      
      return {
        success: true,
        redirectUrl
      };

    } catch (error: any) {
      console.error('❌ Error handling upgrade success:', error);
      return {
        success: false,
        error: error.message || 'Failed to process upgrade'
      };
    }
  }

  /**
   * Process payment success from Stripe callback
   */
  static async processStripeCallback(sessionId: string): Promise<{
    success: boolean;
    redirectUrl?: string;
    error?: string;
  }> {
    try {
      console.log('💳 Processing Stripe callback for session:', sessionId);

      // Get current user
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      
      if (authError || !user) {
        return {
          success: false,
          error: 'User not authenticated'
        };
      }

      // Verify the payment session (this would typically call your backend)
      // For now, we'll trust that if we got here, payment was successful
      
      return await this.handleUpgradeSuccess(user);

    } catch (error: any) {
      console.error('❌ Error processing Stripe callback:', error);
      return {
        success: false,
        error: error.message || 'Failed to process payment callback'
      };
    }
  }

  /**
   * Generate checkout session URL with proper success/cancel URLs
   */
  static generateCheckoutUrls() {
    const baseUrl = window.location.origin;
    
    return {
      successUrl: `${baseUrl}/payment-success?session_id={CHECKOUT_SESSION_ID}`,
      cancelUrl: `${baseUrl}/payment-cancelled`
    };
  }

  /**
   * Check if user should be redirected after successful auth
   */
  static shouldRedirectAfterAuth(): { shouldRedirect: boolean; url?: string } {
    const intent = this.getUpgradeIntent();
    
    if (intent) {
      return {
        shouldRedirect: true,
        url: intent.redirectUrl
      };
    }

    return { shouldRedirect: false };
  }

  /**
   * Handle payment cancellation
   */
  static handlePaymentCancellation(): void {
    // Keep the intent so user can retry
    console.log('💔 Payment cancelled, keeping upgrade intent for retry');
  }

  /**
   * Create a seamless upgrade flow context
   */
  static createUpgradeContext(sourceContext: string) {
    return {
      storeIntent: (plan: 'monthly' | 'yearly', redirectUrl: string = '/dashboard') => {
        this.storeUpgradeIntent({
          plan,
          redirectUrl,
          sourceContext
        });
      },
      
      hasStoredIntent: () => {
        return !!this.getUpgradeIntent();
      },
      
      getContext: () => {
        const intent = this.getUpgradeIntent();
        return intent?.sourceContext || null;
      }
    };
  }
}

// Export convenience methods for common use cases
export const createBlogUpgradeFlow = () => PremiumUpgradeService.createUpgradeContext('blog-post');
export const createSEOUpgradeFlow = () => PremiumUpgradeService.createUpgradeContext('seo-analysis');
export const createDashboardUpgradeFlow = () => PremiumUpgradeService.createUpgradeContext('dashboard');
