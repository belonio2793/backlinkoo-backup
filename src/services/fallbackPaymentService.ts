/**
 * Fallback Payment Service
 * Provides alternative payment flows when Netlify functions fail
 */

interface FallbackPaymentOptions {
  type: 'credits' | 'premium';
  credits?: number;
  plan?: 'monthly' | 'annual';
}

class FallbackPaymentService {
  
  /**
   * Open payment with fallback mechanisms
   */
  static async openPayment(options: FallbackPaymentOptions): Promise<void> {
    console.log('🔄 Using fallback payment service');
    
    try {
      // Try alternative approaches
      if (options.type === 'premium') {
        await this.openPremiumFallback(options.plan || 'monthly');
      } else {
        await this.openCreditsFallback(options.credits || 50);
      }
    } catch (error) {
      console.error('Fallback payment also failed:', error);
      this.showPaymentUnavailableMessage();
    }
  }
  
  /**
   * Premium subscription fallback
   */
  private static async openPremiumFallback(plan: 'monthly' | 'annual'): Promise<void> {
    // Try direct Stripe checkout URLs if available
    const stripeUrls = {
      monthly: process.env.VITE_STRIPE_PREMIUM_CHECKOUT_URL_MONTHLY,
      annual: process.env.VITE_STRIPE_PREMIUM_CHECKOUT_URL_ANNUAL
    };
    
    const checkoutUrl = stripeUrls[plan];
    
    if (checkoutUrl) {
      console.log('🔗 Using direct Stripe checkout URL');
      const checkoutWindow = window.open(checkoutUrl, 'stripe-checkout', 'width=800,height=600');
      if (!checkoutWindow) {
        window.location.href = checkoutUrl;
      }
      return;
    }
    
    // Fallback to contact form or alternative
    this.showContactForm('premium', plan);
  }
  
  /**
   * Credits purchase fallback
   */
  private static async openCreditsFallback(credits: number): Promise<void> {
    // Calculate price
    const price = this.getCreditsPrice(credits);
    
    // Try direct payment link if available
    const directPaymentUrl = process.env.VITE_DIRECT_PAYMENT_URL;
    
    if (directPaymentUrl) {
      const url = `${directPaymentUrl}?credits=${credits}&amount=${price}`;
      const checkoutWindow = window.open(url, 'payment', 'width=800,height=600');
      if (!checkoutWindow) {
        window.location.href = url;
      }
      return;
    }
    
    // Fallback to contact form
    this.showContactForm('credits', credits);
  }
  
  /**
   * Show contact form when all payment methods fail
   */
  private static showContactForm(type: 'credits' | 'premium', value: any): void {
    const message = type === 'premium' 
      ? `I'd like to upgrade to Premium (${value} plan). Please help me with the payment process.`
      : `I'd like to purchase ${value} credits. Please help me with the payment process.`;
    
    const subject = type === 'premium' ? 'Premium Upgrade Request' : 'Credits Purchase Request';
    
    // Create mailto link
    const mailtoUrl = `mailto:support@backlinkoo.com?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(message)}`;
    
    // Show user-friendly message
    const userConfirm = confirm(
      `Payment system is temporarily unavailable. Would you like to contact support to complete your ${type === 'premium' ? 'upgrade' : 'purchase'}?\n\nWe'll process your request manually within 24 hours.`
    );
    
    if (userConfirm) {
      window.open(mailtoUrl);
    }
  }
  
  /**
   * Show payment unavailable message
   */
  private static showPaymentUnavailableMessage(): void {
    alert(
      '⚠️ Payment System Temporarily Unavailable\n\n' +
      'We\'re experiencing technical difficulties with our payment system. ' +
      'Please try again in a few minutes or contact support@backlinkoo.com for assistance.\n\n' +
      'We apologize for the inconvenience!'
    );
  }
  
  /**
   * Get credits pricing
   */
  private static getCreditsPrice(credits: number): number {
    if (credits <= 50) return 19;
    if (credits <= 100) return 29;
    if (credits <= 250) return 49;
    if (credits <= 500) return 79;
    return 99;
  }
}

export default FallbackPaymentService;
export { FallbackPaymentService };
