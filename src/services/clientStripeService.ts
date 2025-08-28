/**
 * Client-side Stripe Checkout Service
 * Fallback when server-side Edge Functions are not configured
 */

interface ClientPaymentOptions {
  amount: number;
  credits: number;
  productName?: string;
  userEmail?: string;
}

interface ClientPaymentResult {
  success: boolean;
  url?: string;
  error?: string;
}

export class ClientStripeService {
  private static stripePublicKey = import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY;

  /**
   * Check if Stripe is configured for client-side checkout
   */
  static isConfigured(): boolean {
    return !!this.stripePublicKey && this.stripePublicKey.startsWith('pk_');
  }

  /**
   * Create a client-side payment session using Stripe Checkout
   * This is a fallback when server-side functions are not available
   */
  static async createClientPayment(options: ClientPaymentOptions): Promise<ClientPaymentResult> {
    if (!this.isConfigured()) {
      return {
        success: false,
        error: 'Stripe is not configured. Please contact support.'
      };
    }

    try {
      // For client-side only implementation, we need to redirect to a pre-configured
      // Stripe Payment Link or use Stripe's direct checkout
      console.log('🔧 Using client-side Stripe fallback');
      
      // Create payment link parameters
      const paymentParams = new URLSearchParams({
        'prefilled_email': options.userEmail || '',
        'client_reference_id': `credits_${options.credits}_${Date.now()}`,
        'success_url': `${window.location.origin}/payment-success?credits=${options.credits}`,
        'cancel_url': `${window.location.origin}/payment-cancelled`
      });

      // For demo purposes, create a simple checkout URL
      // In production, you'd want to use Stripe Payment Links or a configured checkout
      const checkoutUrl = `https://checkout.stripe.com/pay/${this.getProductId(options.credits)}?${paymentParams.toString()}`;

      return {
        success: true,
        url: checkoutUrl
      };
      
    } catch (error) {
      console.error('❌ Client Stripe error:', error);
      return {
        success: false,
        error: 'Failed to create payment session. Please try again.'
      };
    }
  }

  /**
   * Get Stripe product ID based on credits
   * These would be pre-configured in your Stripe dashboard
   */
  private static getProductId(credits: number): string {
    // These are example product IDs - replace with your actual Stripe Payment Link IDs
    const productMap: Record<number, string> = {
      50: 'plink_1234567890abcdef',    // 50 credits for $70
      100: 'plink_abcdef1234567890',   // 100 credits for $140  
      250: 'plink_fedcba0987654321',   // 250 credits for $350
      500: 'plink_123456abcdef7890'    // 500 credits for $700
    };

    // Find the closest match or use custom calculation
    const exactMatch = productMap[credits];
    if (exactMatch) {
      return exactMatch;
    }

    // For custom amounts, use the 100-credit product as base
    return productMap[100];
  }

  /**
   * Open checkout in new window
   */
  static openCheckout(url: string): void {
    try {
      const checkoutWindow = window.open(
        url,
        'stripe-checkout',
        'width=600,height=700,scrollbars=yes,resizable=yes'
      );

      if (!checkoutWindow) {
        // Fallback to same window if popup blocked
        window.location.href = url;
      }
    } catch (error) {
      console.error('Failed to open checkout:', error);
      window.location.href = url;
    }
  }
}

export default ClientStripeService;
