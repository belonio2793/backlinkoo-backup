import { supabase } from '@/integrations/supabase/client';
import { userService } from './userService';
import { PremiumUpgradeService } from './premiumUpgradeService';

export interface PaymentVerificationResult {
  success: boolean;
  verified: boolean;
  subscribed?: boolean;
  error?: string;
  redirectUrl?: string;
}

export class PaymentVerificationService {
  /**
   * Verify Stripe payment and upgrade user to premium
   */
  static async verifyStripePayment(sessionId: string): Promise<PaymentVerificationResult> {
    try {
      console.log('🔍 Verifying Stripe payment with session ID:', sessionId);

      // Call the verify-payment edge function
      const { data, error } = await supabase.functions.invoke('verify-payment', {
        body: {
          sessionId,
          type: 'subscription'
        }
      });

      if (error) {
        console.error('❌ Payment verification error:', error);
        return {
          success: false,
          verified: false,
          error: 'Failed to verify payment with Stripe'
        };
      }

      if (data && data.subscribed) {
        console.log('✅ Payment verified - upgrading user to premium');
        
        // Upgrade user to premium role
        const upgradeResult = await userService.upgradeToPremium();
        
        if (upgradeResult.success) {
          // Initialize premium features
          const { data: { user } } = await supabase.auth.getUser();
          if (user) {
            await userService.initializePremiumFeatures(user.id);
          }

          // Get redirect URL from stored intent
          const intent = PremiumUpgradeService.getUpgradeIntent();
          const redirectUrl = intent?.redirectUrl || '/dashboard';
          
          // Clear the upgrade intent
          PremiumUpgradeService.clearUpgradeIntent();

          return {
            success: true,
            verified: true,
            subscribed: true,
            redirectUrl
          };
        } else {
          return {
            success: false,
            verified: true,
            error: upgradeResult.message
          };
        }
      }

      return {
        success: false,
        verified: false,
        error: 'Payment verification failed'
      };

    } catch (error: any) {
      console.error('❌ Exception during payment verification:', error);
      return {
        success: false,
        verified: false,
        error: error.message || 'Unexpected error during payment verification'
      };
    }
  }

  /**
   * Verify PayPal payment and upgrade user to premium
   */
  static async verifyPayPalPayment(orderId: string): Promise<PaymentVerificationResult> {
    try {
      console.log('🔍 Verifying PayPal payment with order ID:', orderId);

      // Call the verify-payment edge function
      const { data, error } = await supabase.functions.invoke('verify-payment', {
        body: {
          paypalOrderId: orderId,
          type: 'payment'
        }
      });

      if (error) {
        console.error('❌ PayPal verification error:', error);
        return {
          success: false,
          verified: false,
          error: 'Failed to verify payment with PayPal'
        };
      }

      if (data && data.verified) {
        console.log('✅ PayPal payment verified - upgrading user to premium');
        
        // Upgrade user to premium role
        const upgradeResult = await userService.upgradeToPremium();
        
        if (upgradeResult.success) {
          // Initialize premium features
          const { data: { user } } = await supabase.auth.getUser();
          if (user) {
            await userService.initializePremiumFeatures(user.id);
          }

          // Get redirect URL from stored intent
          const intent = PremiumUpgradeService.getUpgradeIntent();
          const redirectUrl = intent?.redirectUrl || '/dashboard';
          
          // Clear the upgrade intent
          PremiumUpgradeService.clearUpgradeIntent();

          return {
            success: true,
            verified: true,
            redirectUrl
          };
        } else {
          return {
            success: false,
            verified: true,
            error: upgradeResult.message
          };
        }
      }

      return {
        success: false,
        verified: false,
        error: 'PayPal payment verification failed'
      };

    } catch (error: any) {
      console.error('❌ Exception during PayPal verification:', error);
      return {
        success: false,
        verified: false,
        error: error.message || 'Unexpected error during PayPal verification'
      };
    }
  }

  /**
   * Auto-detect payment method and verify accordingly
   */
  static async verifyPayment(params: {
    sessionId?: string;
    orderId?: string;
    paymentMethod?: 'stripe' | 'paypal';
  }): Promise<PaymentVerificationResult> {
    const { sessionId, orderId, paymentMethod } = params;

    if (sessionId || paymentMethod === 'stripe') {
      if (!sessionId) {
        return {
          success: false,
          verified: false,
          error: 'Session ID required for Stripe verification'
        };
      }
      return await this.verifyStripePayment(sessionId);
    }

    if (orderId || paymentMethod === 'paypal') {
      if (!orderId) {
        return {
          success: false,
          verified: false,
          error: 'Order ID required for PayPal verification'
        };
      }
      return await this.verifyPayPalPayment(orderId);
    }

    return {
      success: false,
      verified: false,
      error: 'No valid payment identifiers provided'
    };
  }

  /**
   * Handle fallback upgrade when payment providers are not available
   */
  static async handleFallbackUpgrade(): Promise<PaymentVerificationResult> {
    try {
      console.log('🔄 Processing fallback upgrade...');

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        return {
          success: false,
          verified: false,
          error: 'User not authenticated'
        };
      }

      // Upgrade user to premium role
      const upgradeResult = await userService.upgradeToPremium();
      
      if (upgradeResult.success) {
        // Initialize premium features
        await userService.initializePremiumFeatures(user.id);

        // Get redirect URL from stored intent
        const intent = PremiumUpgradeService.getUpgradeIntent();
        const redirectUrl = intent?.redirectUrl || '/dashboard';
        
        // Clear the upgrade intent
        PremiumUpgradeService.clearUpgradeIntent();

        return {
          success: true,
          verified: true,
          redirectUrl
        };
      } else {
        return {
          success: false,
          verified: false,
          error: upgradeResult.message
        };
      }

    } catch (error: any) {
      console.error('❌ Exception during fallback upgrade:', error);
      return {
        success: false,
        verified: false,
        error: error.message || 'Unexpected error during fallback upgrade'
      };
    }
  }

  /**
   * Check if user is already premium (useful for duplicate payment checks)
   */
  static async checkExistingPremiumStatus(): Promise<{
    isPremium: boolean;
    hasActiveSubscription: boolean;
  }> {
    try {
      const profile = await userService.getCurrentUserProfile();
      const isPremium = profile?.role === 'premium' || profile?.role === 'admin';
      const hasActiveSubscription = profile?.subscription_status === 'active';

      return {
        isPremium,
        hasActiveSubscription
      };
    } catch (error: any) {
      console.error('Error checking premium status:', error);
      return {
        isPremium: false,
        hasActiveSubscription: false
      };
    }
  }

  /**
   * Validate payment intent and user state before processing
   */
  static async validatePaymentIntent(): Promise<{
    canProceed: boolean;
    reason?: string;
  }> {
    try {
      // Check if user is authenticated
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        return {
          canProceed: false,
          reason: 'User not authenticated'
        };
      }

      // Check if user is already premium
      const { isPremium } = await this.checkExistingPremiumStatus();
      if (isPremium) {
        return {
          canProceed: false,
          reason: 'User already has premium access'
        };
      }

      return { canProceed: true };

    } catch (error: any) {
      console.error('Error validating payment intent:', error);
      return {
        canProceed: false,
        reason: 'Unable to validate user state'
      };
    }
  }
}

export default PaymentVerificationService;
