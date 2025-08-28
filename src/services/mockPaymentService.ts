/**
 * Mock Payment Service
 * Provides fallback payment functionality for development and testing
 */

interface PaymentResult {
  success: boolean;
  url?: string;
  sessionId?: string;
  orderId?: string;
  error?: string;
  checkoutSessionId?: string;
  usedFallback?: boolean;
}

class MockPaymentService {
  private enabled: boolean = true;

  /**
   * Check if mock payment service is available
   */
  isAvailable(): boolean {
    return this.enabled && import.meta.env.DEV;
  }

  /**
   * Mock payment creation for credits
   */
  async createPayment(
    amount: number,
    credits: number,
    paymentMethod: 'stripe',
    isGuest: boolean = false,
    guestEmail?: string
  ): Promise<PaymentResult> {
    // Simulate processing delay
    await new Promise(resolve => setTimeout(resolve, 1500));

    const sessionId = `mock_session_${Date.now()}`;
    const orderId = `mock_order_${Date.now()}`;

    console.log('🎭 Mock Payment Service: Simulating payment creation', {
      amount,
      credits,
      paymentMethod,
      isGuest,
      guestEmail,
      sessionId,
      orderId
    });

    return {
      success: true,
      url: `/payment-success?demo=true&credits=${credits}&amount=${amount}&sessionId=${sessionId}`,
      sessionId,
      orderId,
      usedFallback: true
    };
  }

  /**
   * Mock subscription creation
   */
  async createSubscription(
    plan: 'monthly' | 'yearly',
    isGuest: boolean = false,
    guestEmail?: string
  ): Promise<PaymentResult> {
    // Simulate processing delay
    await new Promise(resolve => setTimeout(resolve, 1500));

    const sessionId = `mock_sub_session_${Date.now()}`;

    console.log('🎭 Mock Payment Service: Simulating subscription creation', {
      plan,
      isGuest,
      guestEmail,
      sessionId
    });

    return {
      success: true,
      url: `/subscription-success?demo=true&plan=${plan}&sessionId=${sessionId}`,
      sessionId,
      usedFallback: true
    };
  }

  /**
   * Enable or disable mock service
   */
  setEnabled(enabled: boolean): void {
    this.enabled = enabled;
  }
}

// Export singleton instance
export const mockPaymentService = new MockPaymentService();
