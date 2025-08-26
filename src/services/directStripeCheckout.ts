/**
 * Direct Stripe Checkout Service
 * For immediate payment processing without modals
 */

import { stripePaymentService } from './stripePaymentService';

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
   */
  static async buyCredits(credits: number, guestEmail?: string): Promise<void> {
    const pricing = {
      50: 70,
      100: 140,
      250: 350,
      500: 700
    };

    // Default pricing at $1.40 per credit for non-preset amounts
    const amount = pricing[credits as keyof typeof pricing] || credits * 1.40;

    const result = await stripePaymentService.createPayment({
      amount,
      credits,
      productName: `${credits} Premium Backlink Credits`,
      type: 'credits',
      isGuest: !!guestEmail,
      guestEmail
    });

    if (!result.success) {
      throw new Error(result.error || 'Failed to initiate credit purchase');
    }
  }

  /**
   * Direct premium subscription purchase
   */
  static async upgradeToPremium(plan: 'monthly' | 'yearly', guestEmail?: string): Promise<void> {
    const result = await stripePaymentService.createSubscription({
      plan,
      amount: plan === 'monthly' ? 29 : 290,
      type: 'subscription',
      isGuest: !!guestEmail,
      guestEmail
    });

    if (!result.success) {
      throw new Error(result.error || 'Failed to initiate premium subscription');
    }
  }

  /**
   * Direct checkout with custom parameters
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
   */
  static async quick50Credits(guestEmail?: string) {
    return this.buyCredits(50, guestEmail);
  }

  static async quick100Credits(guestEmail?: string) {
    return this.buyCredits(100, guestEmail);
  }

  static async quick250Credits(guestEmail?: string) {
    return this.buyCredits(250, guestEmail);
  }

  static async quick500Credits(guestEmail?: string) {
    return this.buyCredits(500, guestEmail);
  }

  static async quickMonthlyPremium(guestEmail?: string) {
    return this.upgradeToPremium('monthly', guestEmail);
  }

  static async quickYearlyPremium(guestEmail?: string) {
    return this.upgradeToPremium('yearly', guestEmail);
  }
}

// Export convenience functions
export const directBuyCredits = DirectStripeCheckout.buyCredits;
export const directUpgradePremium = DirectStripeCheckout.upgradeToPremium;
export const directCheckout = DirectStripeCheckout.directCheckout;

// Export preset functions
export const buy50Credits = (email?: string) => DirectStripeCheckout.quick50Credits(email);
export const buy100Credits = (email?: string) => DirectStripeCheckout.quick100Credits(email);
export const buy250Credits = (email?: string) => DirectStripeCheckout.quick250Credits(email);
export const buy500Credits = (email?: string) => DirectStripeCheckout.quick500Credits(email);
export const upgradeMonthly = (email?: string) => DirectStripeCheckout.quickMonthlyPremium(email);
export const upgradeYearly = (email?: string) => DirectStripeCheckout.quickYearlyPremium(email);

export default DirectStripeCheckout;
