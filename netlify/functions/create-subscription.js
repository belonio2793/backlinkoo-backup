const { createClient } = require('@supabase/supabase-js');

// Initialize Supabase client for database operations
function getSupabaseClient() {
  const supabaseUrl = process.env.VITE_SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseServiceKey) {
    console.warn("Supabase configuration missing - subscription tracking disabled");
    return null;
  }

  return createClient(supabaseUrl, supabaseServiceKey, {
    auth: { persistSession: false }
  });
}

function sanitizeInput(input) {
  return input.replace(/[<>'"&]/g, '').trim();
}

async function createStripeSubscription(subscriptionData, email, originUrl) {
  const stripeSecretKey = process.env.STRIPE_SECRET_KEY;

  if (!stripeSecretKey || stripeSecretKey.includes('placeholder')) {
    throw new Error("Stripe is not configured for this environment. Please set up your Stripe API keys in Netlify environment variables.");
  }

  // Dynamic import of Stripe for better compatibility
  const Stripe = (await import('stripe')).default;
  const stripe = new Stripe(stripeSecretKey, {
    apiVersion: "2023-10-16",
  });

  // Get or create customer
  let customerId;
  if (!subscriptionData.isGuest) {
    const customers = await stripe.customers.list({ email, limit: 1 });
    if (customers.data.length > 0) {
      customerId = customers.data[0].id;
    } else {
      const customer = await stripe.customers.create({ email });
      customerId = customer.id;
    }
  }

  // Price configuration - use environment variables or create dynamic prices
  let priceId;
  
  if (subscriptionData.plan === 'monthly') {
    priceId = process.env.STRIPE_MONTHLY_PRICE_ID || process.env.VITE_STRIPE_MONTHLY_PRICE_ID;
  } else if (subscriptionData.plan === 'yearly') {
    priceId = process.env.STRIPE_YEARLY_PRICE_ID || process.env.VITE_STRIPE_YEARLY_PRICE_ID;
  } else {
    // Fallback to provided priceId
    priceId = subscriptionData.priceId;
  }

  // If no price ID is configured, create a dynamic price
  if (!priceId) {
    console.log('No predefined price ID found, creating dynamic price');
    
    const prices = {
      monthly: { amount: 2900, interval: 'month' }, // $29/month
      yearly: { amount: 29000, interval: 'year' }   // $290/year
    };
    
    const priceConfig = prices[subscriptionData.plan] || prices.monthly;
    
    // Create or find product
    let product;
    const products = await stripe.products.list({ limit: 1 });
    if (products.data.length > 0) {
      product = products.data[0];
    } else {
      product = await stripe.products.create({
        name: 'Premium SEO Tools',
        description: 'Premium subscription with unlimited backlinks and advanced features'
      });
    }

    // Create price
    const price = await stripe.prices.create({
      currency: 'usd',
      product: product.id,
      recurring: { interval: priceConfig.interval },
      unit_amount: priceConfig.amount,
    });
    
    priceId = price.id;
  }

  // Create checkout session
  const session = await stripe.checkout.sessions.create({
    customer: customerId,
    customer_email: customerId ? undefined : email,
    line_items: [
      {
        price: priceId,
        quantity: 1,
      },
    ],
    mode: "subscription",
    success_url: `${originUrl}/subscription-success?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${originUrl}/subscription-cancelled`,
    metadata: {
      email,
      plan: subscriptionData.plan || 'monthly',
      isGuest: subscriptionData.isGuest ? 'true' : 'false',
      tier: subscriptionData.tier || 'premium'
    }
  });

  return { url: session.url, sessionId: session.id };
}

exports.handler = async (event, context) => {
  // Handle CORS preflight
  if (event.httpMethod === "OPTIONS") {
    return {
      statusCode: 200,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "POST, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type, Authorization",
      },
    };
  }

  if (event.httpMethod !== "POST") {
    return {
      statusCode: 405,
      headers: { 
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*"
      },
      body: JSON.stringify({ error: "Method not allowed" }),
    };
  }

  try {
    const body = JSON.parse(event.body || '{}');
    
    // Input validation
    if (!body.plan && !body.priceId) {
      throw new Error('Either plan (monthly/yearly) or priceId is required');
    }

    if (body.plan && !['monthly', 'yearly'].includes(body.plan)) {
      throw new Error('Invalid plan. Must be monthly or yearly');
    }
    
    const { isGuest = false } = body;
    let guestEmail = body.guestEmail ? sanitizeInput(body.guestEmail) : '';
    
    let email = guestEmail;

    // For authenticated users, we should get email from auth header in production
    if (!isGuest && !email) {
      throw new Error("Email is required for subscription processing");
    }

    if (isGuest && (!guestEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(guestEmail))) {
      throw new Error('Valid email address is required for guest subscription');
    }

    const originUrl = event.headers.origin || event.headers.referer || "https://backlinkoo.com";
    
    const result = await createStripeSubscription(body, email, originUrl);

    // Store subscription in database for tracking
    try {
      const supabase = getSupabaseClient();
      if (supabase && result.sessionId) {
        await supabase
          .from('subscriptions')
          .insert({
            stripe_session_id: result.sessionId,
            email,
            plan: body.plan || 'monthly',
            status: 'pending',
            tier: body.tier || 'premium',
            guest_checkout: body.isGuest || false,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          });
        console.log(`Subscription created: ${result.sessionId} - ${email} - ${body.plan || 'monthly'}`);
      }
    } catch (dbError) {
      console.error('Database subscription creation failed:', dbError);
      // Don't fail the subscription creation if database fails
    }

    console.log(`Subscription initiated: ${email} - ${body.plan || 'monthly'}`);

    return {
      statusCode: 200,
      headers: { 
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*"
      },
      body: JSON.stringify(result),
    };

  } catch (error) {
    console.error("Subscription creation error:", error);
    
    return {
      statusCode: 500,
      headers: { 
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*"
      },
      body: JSON.stringify({ 
        error: error.message || 'Subscription processing failed. Please try again.',
        details: process.env.NODE_ENV === 'development' ? error.stack : undefined
      }),
    };
  }
};
