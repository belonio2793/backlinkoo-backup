import type { Context, Config } from "@netlify/functions";
import Stripe from "stripe";

interface SubscriptionRequest {
  plan: 'monthly' | 'yearly';
  isGuest?: boolean;
  guestEmail?: string;
  paymentMethod?: 'stripe' | 'paypal';
}

// Rate limiting map
const rateLimitMap = new Map<string, { count: number, resetTime: number }>();

function checkRateLimit(identifier: string): boolean {
  const now = Date.now();
  const windowMs = 60000; // 1 minute
  const maxRequests = 5; // Lower limit for subscriptions
  
  const record = rateLimitMap.get(identifier);
  if (!record || now > record.resetTime) {
    rateLimitMap.set(identifier, { count: 1, resetTime: now + windowMs });
    return true;
  }
  
  if (record.count >= maxRequests) {
    return false;
  }
  
  record.count++;
  return true;
}

function sanitizeInput(input: string): string {
  return input.replace(/[<>'"&]/g, '').trim();
}

async function getClientIP(request: Request): Promise<string> {
  const forwarded = request.headers.get('x-forwarded-for');
  const realIP = request.headers.get('x-real-ip');
  const cfConnectingIP = request.headers.get('cf-connecting-ip');
  
  return forwarded?.split(',')[0]?.trim() || realIP || cfConnectingIP || 'unknown';
}

// Define pricing for dynamic product creation
const PRICING_CONFIG = {
  monthly: {
    price: 29,
    originalPrice: 49,
    interval: 'month' as const,
    discount: 41
  },
  yearly: {
    price: 290,
    originalPrice: 588,
    interval: 'year' as const,
    discount: 51,
    savings: 298
  }
};

async function createStripeSubscription(
  subscriptionData: SubscriptionRequest,
  email: string,
  originUrl: string
): Promise<{ url: string; sessionId: string }> {
  const stripe = new Stripe(Netlify.env.get("STRIPE_SECRET_KEY") || "", {
    apiVersion: "2023-10-16",
  });

  const planConfig = PRICING_CONFIG[subscriptionData.plan];
  
  // Create or find customer
  let customerId;
  if (!subscriptionData.isGuest) {
    const customers = await stripe.customers.list({ email, limit: 1 });
    if (customers.data.length > 0) {
      customerId = customers.data[0].id;
    } else {
      const customer = await stripe.customers.create({
        email,
        metadata: { plan: subscriptionData.plan }
      });
      customerId = customer.id;
    }
  }

  // Create dynamic product and price
  const product = await stripe.products.create({
    name: `Premium SEO Tools - ${subscriptionData.plan.charAt(0).toUpperCase() + subscriptionData.plan.slice(1)}`,
    description: `Access to all premium SEO tools and features - ${subscriptionData.plan} billing`,
    metadata: {
      plan: subscriptionData.plan,
      features: JSON.stringify([
        'Unlimited Backlinks',
        'Complete SEO Academy (50+ Lessons)',
        'Advanced Analytics & Reports',
        'Priority 24/7 Support',
        'White-Hat Guarantee',
        'Custom Campaign Strategies',
        'Professional Certifications',
        'API Access & Integrations'
      ])
    }
  });

  const price = await stripe.prices.create({
    product: product.id,
    unit_amount: planConfig.price * 100, // Convert to cents
    currency: 'usd',
    recurring: {
      interval: planConfig.interval,
    },
    metadata: {
      plan: subscriptionData.plan,
      originalPrice: planConfig.originalPrice.toString(),
      discount: planConfig.discount.toString()
    }
  });

  // Create checkout session
  const session = await stripe.checkout.sessions.create({
    customer: customerId,
    customer_email: customerId ? undefined : email,
    line_items: [
      {
        price: price.id,
        quantity: 1,
      },
    ],
    mode: "subscription",
    success_url: `${originUrl}/subscription-success?session_id={CHECKOUT_SESSION_ID}&plan=${subscriptionData.plan}`,
    cancel_url: `${originUrl}/subscription-cancelled`,
    metadata: {
      email,
      plan: subscriptionData.plan,
      isGuest: subscriptionData.isGuest ? 'true' : 'false',
      productId: product.id,
      priceId: price.id
    },
    subscription_data: {
      metadata: {
        email,
        plan: subscriptionData.plan,
        isGuest: subscriptionData.isGuest ? 'true' : 'false'
      }
    }
  });

  return { url: session.url!, sessionId: session.id };
}

export default async (req: Request, context: Context) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 200,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "POST, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type, Authorization",
      },
    });
  }

  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { "Content-Type": "application/json" },
    });
  }

  try {
    // Rate limiting check
    const clientIP = await getClientIP(req);
    if (!checkRateLimit(clientIP)) {
      return new Response(
        JSON.stringify({ error: 'Rate limit exceeded. Please try again in a minute.' }),
        { 
          status: 429, 
          headers: { 
            "Content-Type": "application/json",
            "Access-Control-Allow-Origin": "*"
          } 
        }
      );
    }

    const body: SubscriptionRequest = await req.json();
    
    // Input validation
    if (!body.plan || !['monthly', 'yearly'].includes(body.plan)) {
      throw new Error('Invalid subscription plan. Must be "monthly" or "yearly"');
    }
    
    const { plan, isGuest = false } = body;
    let guestEmail = body.guestEmail ? sanitizeInput(body.guestEmail) : '';
    
    let email = guestEmail;

    // For authenticated users, we should get email from auth header in production
    if (!email) {
      throw new Error("Email is required for subscription");
    }

    if (isGuest && (!guestEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(guestEmail))) {
      throw new Error('Valid email address is required');
    }

    const originUrl = req.headers.get("origin") || "https://backlinkoo.com";

    // Currently only supporting Stripe for subscriptions
    const result = await createStripeSubscription(body, email, originUrl);

    // TODO: Store subscription intent in database for tracking
    console.log(`Subscription initiated: ${plan} - ${email}`);

    return new Response(JSON.stringify(result), {
      headers: { 
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*"
      },
    });

  } catch (error: any) {
    console.error("Subscription creation error:", error);
    
    return new Response(
      JSON.stringify({ 
        error: error.message || 'Subscription processing failed. Please try again.',
        details: process.env.NODE_ENV === 'development' ? error.stack : undefined
      }), 
      {
        status: 500,
        headers: { 
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*"
        },
      }
    );
  }
};

export const config: Config = {
  path: "/api/create-subscription"
};
