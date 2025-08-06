/**
 * Mock Payment Service
 * Provides payment functionality when Netlify functions aren't available
 */

interface PaymentResult {
  success: boolean;
  url?: string;
  sessionId?: string;
  orderId?: string;
  error?: string;
}

interface SubscriptionResult {
  success: boolean;
  url?: string;
  sessionId?: string;
  error?: string;
}

export class MockPaymentService {
  private static instance: MockPaymentService;
  private isEnabled: boolean;

  constructor() {
    // Enable mock service in development or when functions aren't available
    this.isEnabled = import.meta.env.DEV || window.location.hostname.includes('fly.dev');
  }

  static getInstance(): MockPaymentService {
    if (!MockPaymentService.instance) {
      MockPaymentService.instance = new MockPaymentService();
    }
    return MockPaymentService.instance;
  }

  async createPayment(
    amount: number,
    credits: number,
    paymentMethod: string = 'stripe',
    isGuest: boolean = false,
    guestEmail?: string
  ): Promise<PaymentResult> {
    console.log('🔄 MockPaymentService: Creating payment simulation');

    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Validate inputs
    if (!amount || amount <= 0) {
      return {
        success: false,
        error: 'Invalid amount specified'
      };
    }

    if (!credits || credits <= 0) {
      return {
        success: false,
        error: 'Invalid credits specified'
      };
    }

    if (isGuest && (!guestEmail || !guestEmail.includes('@'))) {
      return {
        success: false,
        error: 'Valid email required for guest checkout'
      };
    }

    // Generate mock session ID
    const sessionId = `mock_session_${Date.now()}_${Math.random().toString(36).substr(2, 8)}`;
    
    // Simulate success URL that would come from Stripe
    const successUrl = `${window.location.origin}/payment-success?session_id=${sessionId}&credits=${credits}&mock=true`;

    console.log('✅ MockPaymentService: Payment simulation created', {
      sessionId,
      amount,
      credits,
      successUrl
    });

    return {
      success: true,
      url: successUrl,
      sessionId,
      orderId: `mock_order_${Date.now()}`
    };
  }

  async createSubscription(
    plan: string,
    isGuest: boolean = false,
    guestEmail?: string
  ): Promise<SubscriptionResult> {
    console.log('🔄 MockPaymentService: Creating subscription simulation');

    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Validate inputs
    if (!plan || !['monthly', 'yearly'].includes(plan)) {
      return {
        success: false,
        error: 'Invalid subscription plan'
      };
    }

    if (isGuest && (!guestEmail || !guestEmail.includes('@'))) {
      return {
        success: false,
        error: 'Valid email required for guest checkout'
      };
    }

    // Generate mock session ID
    const sessionId = `mock_sub_${Date.now()}_${Math.random().toString(36).substr(2, 8)}`;
    
    // Simulate success URL that would come from Stripe
    const successUrl = `${window.location.origin}/subscription-success?session_id=${sessionId}&plan=${plan}&mock=true`;

    console.log('✅ MockPaymentService: Subscription simulation created', {
      sessionId,
      plan,
      successUrl
    });

    return {
      success: true,
      url: successUrl,
      sessionId
    };
  }

  isAvailable(): boolean {
    return this.isEnabled;
  }

  // Simulate processing the payment success
  async processPaymentSuccess(sessionId: string, credits: number): Promise<boolean> {
    console.log('🔄 MockPaymentService: Processing payment success simulation');
    
    // In a real implementation, this would:
    // 1. Verify the session with payment provider
    // 2. Update user credits in database
    // 3. Send confirmation emails
    
    // For demo, we'll just simulate success
    await new Promise(resolve => setTimeout(resolve, 500));
    
    console.log('✅ MockPaymentService: Payment success processed', {
      sessionId,
      credits
    });
    
    return true;
  }

  // Simulate processing subscription success
  async processSubscriptionSuccess(sessionId: string, plan: string): Promise<boolean> {
    console.log('🔄 MockPaymentService: Processing subscription success simulation');
    
    // In a real implementation, this would:
    // 1. Verify the session with payment provider
    // 2. Create/update subscription in database
    // 3. Grant premium access
    // 4. Send confirmation emails
    
    // For demo, we'll just simulate success
    await new Promise(resolve => setTimeout(resolve, 500));
    
    console.log('✅ MockPaymentService: Subscription success processed', {
      sessionId,
      plan
    });
    
    return true;
  }
}

export const mockPaymentService = MockPaymentService.getInstance();
