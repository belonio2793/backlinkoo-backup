/**
 * Direct Stripe Checkout Service
 * Thin wrapper around central stripeWrapper for backward compatibility
 * @deprecated Use stripeWrapper.quickBuyCredits() and stripeWrapper.quickSubscribe() directly
 */

import { stripeWrapper } from './stripeWrapper';

export interface DirectCheckoutOptions {
  type: 'credits' | 'premium';
  credits?: number;
  plan?: 'monthly' | 'yearly';
  guestEmail?: string;
  amount?: number;
  productName?: string;
}

export class DirectStripeCheckout {
  /**
   * Quick credit purchases without modal
   * @deprecated Use stripeWrapper.quickBuyCredits() directly
   */
  static async buyCredits(credits: number, guestEmail?: string): Promise<void> {
    // Validate preset amounts for quickBuyCredits
    const validCredits = [50, 100, 250, 500];
    if (validCredits.includes(credits)) {
      const result = await stripeWrapper.quickBuyCredits(credits as 50 | 100 | 250 | 500, guestEmail);
      if (!result.success) {
        throw new Error(result.error || 'Failed to initiate credit purchase');
      }
    } else {
      // For custom amounts, use createPayment directly
      const amount = Number((credits * 1.40).toFixed(2)); // $1.40 per credit
      const result = await stripeWrapper.createPayment({
        amount,
        credits,
        productName: `${credits} Premium Backlink Credits`,
        isGuest: !!guestEmail,
        guestEmail
      });

      if (result.success && result.url) {
        stripeWrapper.openCheckoutWindow(result.url, result.sessionId);
      } else {
        throw new Error(result.error || 'Failed to initiate credit purchase');
      }
    }
  }

  /**
   * Direct premium subscription purchase
   * @deprecated Use stripeWrapper.quickSubscribe() directly
   */
  static async upgradeToPremium(plan: 'monthly' | 'yearly', guestEmail?: string): Promise<void> {
    const result = await stripeWrapper.quickSubscribe(plan, guestEmail);
    if (!result.success) {
      throw new Error(result.error || 'Failed to initiate premium subscription');
    }
  }

  /**
   * Direct checkout with custom parameters
   * @deprecated Use stripeWrapper methods directly
   */
  static async directCheckout(options: DirectCheckoutOptions): Promise<void> {
    if (options.type === 'credits') {
      if (!options.credits || options.credits <= 0) {
        throw new Error('Credits must be specified for credit purchases');
      }
      await this.buyCredits(options.credits, options.guestEmail);
    } else if (options.type === 'premium') {
      if (!options.plan) {
        throw new Error('Plan must be specified for premium subscriptions');
      }
      await this.upgradeToPremium(options.plan, options.guestEmail);
    } else {
      throw new Error('Invalid checkout type');
    }
  }

  /**
   * Quick preset purchases
   * @deprecated Use stripeWrapper.quickBuyCredits() directly
   */
  static async quick50Credits(guestEmail?: string) {
    return stripeWrapper.quickBuyCredits(50, guestEmail);
  }

  static async quick100Credits(guestEmail?: string) {
    return stripeWrapper.quickBuyCredits(100, guestEmail);
  }

  static async quick250Credits(guestEmail?: string) {
    return stripeWrapper.quickBuyCredits(250, guestEmail);
  }

  static async quick500Credits(guestEmail?: string) {
    return stripeWrapper.quickBuyCredits(500, guestEmail);
  }

  static async quickMonthlyPremium(guestEmail?: string) {
    return stripeWrapper.quickSubscribe('monthly', guestEmail);
  }

  static async quickYearlyPremium(guestEmail?: string) {
    return stripeWrapper.quickSubscribe('yearly', guestEmail);
  }
}

// Export convenience functions (backward compatibility)
export const directBuyCredits = DirectStripeCheckout.buyCredits;
export const directUpgradePremium = DirectStripeCheckout.upgradeToPremium;
export const directCheckout = DirectStripeCheckout.directCheckout;

// Export preset functions (backward compatibility)
export const buy50Credits = (email?: string) => stripeWrapper.quickBuyCredits(50, email);
export const buy100Credits = (email?: string) => stripeWrapper.quickBuyCredits(100, email);
export const buy250Credits = (email?: string) => stripeWrapper.quickBuyCredits(250, email);
export const buy500Credits = (email?: string) => stripeWrapper.quickBuyCredits(500, email);
export const upgradeMonthly = (email?: string) => stripeWrapper.quickSubscribe('monthly', email);
export const upgradeYearly = (email?: string) => stripeWrapper.quickSubscribe('yearly', email);

export default DirectStripeCheckout;
