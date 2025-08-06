const Stripe = require("stripe");

// Rate limiting map
const rateLimitMap = new Map();

function checkRateLimit(identifier) {
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

function sanitizeInput(input) {
  return input.replace(/[<>'"&]/g, '').trim();
}

async function getClientIP(event) {
  const forwarded = event.headers['x-forwarded-for'];
  const realIP = event.headers['x-real-ip'];
  const cfConnectingIP = event.headers['cf-connecting-ip'];
  
  return forwarded?.split(',')[0]?.trim() || realIP || cfConnectingIP || 'unknown';
}

// Define pricing for dynamic product creation
const PRICING_CONFIG = {
  monthly: {
    price: 29,
    originalPrice: 49,
    interval: 'month',
    credits: 100,
    description: 'Premium Monthly - $1.40 per link'
  },
  yearly: {
    price: 290,
    originalPrice: 588,
    interval: 'year',
    credits: 1200,
    description: 'Premium Yearly - $1.20 per link (2 months free)'
  }
};

async function createStripeSubscription(subscriptionData, email, originUrl) {
  const stripeSecretKey = process.env.STRIPE_SECRET_KEY;

  if (!stripeSecretKey || stripeSecretKey.includes('placeholder')) {
    throw new Error("Stripe is not configured for this environment. Please set up your Stripe API keys or use demo mode.");
  }

  const stripe = new Stripe(stripeSecretKey, {
    apiVersion: "2023-10-16",
  });

  const pricing = PRICING_CONFIG[subscriptionData.plan];
  if (!pricing) {
    throw new Error(`Invalid subscription plan: ${subscriptionData.plan}`);
  }

  let customerId;
  if (!subscriptionData.isGuest) {
    const customers = await stripe.customers.list({ email, limit: 1 });
    if (customers.data.length > 0) {
      customerId = customers.data[0].id;
    }
  }

  // Create or get price
  const price = await stripe.prices.create({
    currency: 'usd',
    unit_amount: pricing.price * 100,
    recurring: { interval: pricing.interval },
    product_data: {
      name: `Premium ${subscriptionData.plan.charAt(0).toUpperCase() + subscriptionData.plan.slice(1)}`,
      description: pricing.description,
      metadata: {
        plan: subscriptionData.plan,
        credits: pricing.credits.toString(),
        type: 'subscription'
      }
    },
    metadata: {
      plan: subscriptionData.plan,
      credits: pricing.credits.toString()
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
    subscription_data: {
      metadata: {
        email,
        plan: subscriptionData.plan,
        isGuest: subscriptionData.isGuest ? 'true' : 'false'
      }
    },
    metadata: {
      email,
      plan: subscriptionData.plan,
      isGuest: subscriptionData.isGuest ? 'true' : 'false'
    }
  });

  return { url: session.url, sessionId: session.id };
}

exports.handler = async (event, context) => {
  // CORS headers
  const headers = {
    "Content-Type": "application/json",
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "Content-Type",
    "Access-Control-Allow-Methods": "POST, OPTIONS"
  };

  // Handle preflight request
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
  }

  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ error: 'Method not allowed' })
    };
  }

  try {
    // Rate limiting based on IP
    const clientIP = await getClientIP(event);
    if (!checkRateLimit(clientIP)) {
      return {
        statusCode: 429,
        headers,
        body: JSON.stringify({ error: 'Too many requests. Please try again later.' })
      };
    }

    const body = JSON.parse(event.body || '{}');
    const { plan, isGuest, guestEmail, paymentMethod = 'stripe' } = body;

    // Input validation
    if (!plan || !['monthly', 'yearly'].includes(plan)) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'Invalid subscription plan. Must be "monthly" or "yearly".' })
      };
    }

    if (paymentMethod !== 'stripe') {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'Only Stripe payments are supported' })
      };
    }

    // Email validation
    let email;
    if (isGuest) {
      if (!guestEmail || !guestEmail.includes('@')) {
        return {
          statusCode: 400,
          headers,
          body: JSON.stringify({ error: 'Valid email address is required for guest checkout.' })
        };
      }
      email = sanitizeInput(guestEmail);
    } else {
      // Get email from context or user data
      email = context.clientContext?.user?.email || 'user@example.com';
    }

    const originUrl = event.headers.origin || event.headers.referer?.split('/').slice(0, 3).join('/') || "https://backlinkoo.com";
    
    const result = await createStripeSubscription(body, email, originUrl);

    console.log(`Subscription initiated: ${plan} - ${email}`);

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify(result)
    };

  } catch (error) {
    console.error("Subscription creation error:", error);
    
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ 
        error: error.message || 'Subscription processing failed. Please try again.',
        details: process.env.NODE_ENV === 'development' ? error.stack : undefined
      })
    };
  }
};
