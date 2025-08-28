/**
 * Enhanced Payment Service
 * Handles both mobile and desktop payment flows with comprehensive error handling
 * Migrated to use central stripeWrapper for payment processing
 */

import { stripeWrapper } from './stripeWrapper';

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
   * Get environment info for diagnostics
   */
  static getEnvironmentInfo() {
    if (typeof window === 'undefined') {
      return {
        isMobile: false,
        isIOSSafari: false,
        userAgent: 'Server',
        viewport: { width: 0, height: 0 },
        supportsPopups: false
      };
    }

    return {
      isMobile: this.isMobile(),
      isIOSSafari: this.isIOSSafari(),
      userAgent: navigator.userAgent,
      viewport: {
        width: window.innerWidth,
        height: window.innerHeight
      },
      supportsPopups: !this.isMobile() || !this.isIOSSafari()
    };
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
   * Create payment session for premium subscription
   * @deprecated Use stripeWrapper.quickSubscribe() directly
   */
  private static async createPremiumPayment(options: PaymentOptions): Promise<PaymentResult> {
    const plan = options.plan || 'monthly';

    console.log('🔄 Creating premium payment via stripeWrapper:', { plan });

    try {
      const result = await stripeWrapper.quickSubscribe(plan, options.email);
      
      return {
        success: result.success,
        url: result.url,
        sessionId: result.sessionId,
        error: result.error,
        usedFallback: result.fallbackUsed
      };
    } catch (error: any) {
      console.error('❌ Premium payment error:', error);
      return {
        success: false,
        error: error.message || 'Failed to create premium subscription'
      };
    }
  }

  /**
   * Create payment session for credits
   * @deprecated Use stripeWrapper.quickBuyCredits() or stripeWrapper.createPayment() directly
   */
  private static async createCreditsPayment(options: PaymentOptions): Promise<PaymentResult> {
    const credits = options.credits!;
    
    console.log('🔄 Creating credits payment via stripeWrapper:', { credits });

    try {
      // Use quickBuyCredits for preset amounts
      const presetAmounts = [50, 100, 250, 500];
      if (presetAmounts.includes(credits)) {
        const result = await stripeWrapper.quickBuyCredits(credits as 50 | 100 | 250 | 500, options.email);
        return {
          success: result.success,
          url: result.url,
          sessionId: result.sessionId,
          error: result.error,
          usedFallback: result.fallbackUsed
        };
      } else {
        // Use createPayment for custom amounts
        const amount = Math.ceil(credits * 1.40); // $1.40 per credit
        const result = await stripeWrapper.createPayment({
          amount,
          credits,
          productName: `${credits} Premium Backlink Credits`,
          isGuest: !!options.email,
          guestEmail: options.email
        });

        if (result.success && result.url) {
          stripeWrapper.openCheckoutWindow(result.url, result.sessionId);
        }

        return {
          success: result.success,
          url: result.url,
          sessionId: result.sessionId,
          error: result.error,
          usedFallback: result.fallbackUsed
        };
      }
    } catch (error: any) {
      console.error('❌ Credits payment error:', error);
      return {
        success: false,
        error: error.message || 'Failed to create credit purchase'
      };
    }
  }

  /**
   * Process payment with enhanced mobile support
   * @deprecated Use stripeWrapper methods directly
   */
  static async processPayment(options: PaymentOptions): Promise<PaymentResult> {
    console.log('💳 Enhanced Payment Service - Processing payment:', options);

    // Validate inputs
    const validation = this.validatePaymentOptions(options);
    if (!validation.isValid) {
      return { success: false, error: validation.error };
    }

    // Get environment info
    const env = this.getEnvironmentInfo();
    console.log('📱 Environment:', env);

    try {
      let result: PaymentResult;

      if (options.type === 'premium') {
        result = await this.createPremiumPayment(options);
      } else {
        result = await this.createCreditsPayment(options);
      }

      if (result.success) {
        console.log('✅ Payment session created successfully');
        
        // For mobile devices, especially iOS Safari, handle differently
        if (env.isMobile && result.url) {
          if (env.isIOSSafari) {
            console.log('📱 iOS Safari detected - redirecting in current window');
            window.location.href = result.url;
          } else {
            console.log('📱 Mobile detected - attempting popup with fallback');
            const popup = window.open(result.url, '_blank');
            if (!popup) {
              console.log('📱 Popup blocked - redirecting in current window');
              window.location.href = result.url;
            }
          }
        }
      }

      return result;
    } catch (error: any) {
      console.error('❌ Enhanced payment service error:', error);
      return {
        success: false,
        error: error.message || 'Payment processing failed'
      };
    }
  }

  /**
   * Direct credit purchase with enhanced mobile handling
   * @deprecated Use stripeWrapper.quickBuyCredits() directly
   */
  static async buyCredits(credits: number, email?: string): Promise<PaymentResult> {
    return this.processPayment({
      type: 'credits',
      credits,
      email
    });
  }

  /**
   * Direct premium subscription with enhanced mobile handling
   * @deprecated Use stripeWrapper.quickSubscribe() directly
   */
  static async upgradeToPremium(plan: 'monthly' | 'yearly', email?: string): Promise<PaymentResult> {
    return this.processPayment({
      type: 'premium',
      plan,
      email
    });
  }

  /**
   * Quick preset credit purchases
   * @deprecated Use stripeWrapper.quickBuyCredits() directly
   */
  static async buy50Credits(email?: string) {
    return stripeWrapper.quickBuyCredits(50, email);
  }

  static async buy100Credits(email?: string) {
    return stripeWrapper.quickBuyCredits(100, email);
  }

  static async buy250Credits(email?: string) {
    return stripeWrapper.quickBuyCredits(250, email);
  }

  static async buy500Credits(email?: string) {
    return stripeWrapper.quickBuyCredits(500, email);
  }

  /**
   * Quick subscription purchases
   * @deprecated Use stripeWrapper.quickSubscribe() directly
   */
  static async upgradeMonthly(email?: string) {
    return stripeWrapper.quickSubscribe('monthly', email);
  }

  static async upgradeYearly(email?: string) {
    return stripeWrapper.quickSubscribe('yearly', email);
  }

  /**
   * Get Stripe wrapper status
   */
  static getStatus() {
    return stripeWrapper.getStatus();
  }
}

export default EnhancedPaymentService;
