const Stripe = require("stripe");
const { createClient } = require('@supabase/supabase-js');

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

// Define pricing with predefined Stripe price IDs (use environment variables in production)
const PRICING_CONFIG = {
  monthly: {
    price: 29,
    originalPrice: 49,
    interval: 'month',
    discount: 41,
    priceId: process.env.STRIPE_PREMIUM_PLAN_MONTHLY || 'price_monthly_fallback',
    productName: 'Premium SEO Tools - Monthly',
    description: 'Access to unlimited backlinks, SEO academy, analytics, and priority support - monthly billing'
  },
  yearly: {
    price: 290,
    originalPrice: 588,
    interval: 'year',
    discount: 51,
    savings: 298,
    priceId: process.env.STRIPE_PREMIUM_PLAN_ANNUAL || 'price_yearly_fallback',
    productName: 'Premium SEO Tools - Yearly',
    description: 'Access to unlimited backlinks, SEO academy, analytics, and priority support - yearly billing (save $298!)'
  }
};

async function createStripeSubscription(subscriptionData, email, originUrl) {
  const stripeSecretKey = process.env.STRIPE_SECRET_KEY;

  if (!stripeSecretKey || !stripeSecretKey.startsWith('sk_')) {
    throw new Error("STRIPE_SECRET_KEY is required and must be a valid Stripe secret key");
  }

  const stripe = new Stripe(stripeSecretKey, {
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

  // Use predefined price ID or create dynamic price as fallback
  let priceId = planConfig.priceId;

  // If using fallback price IDs, create the product and price
  if (priceId.includes('fallback')) {
    console.log('Creating dynamic product and price for', subscriptionData.plan);

    const product = await stripe.products.create({
      name: planConfig.productName,
      description: planConfig.description,
      metadata: {
        plan: subscriptionData.plan,
        type: 'subscription',
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

    priceId = price.id;
  } else {
    console.log('Using predefined price ID:', priceId);
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
    success_url: `${originUrl}/subscription-success?session_id={CHECKOUT_SESSION_ID}&plan=${subscriptionData.plan}`,
    cancel_url: `${originUrl}/subscription-cancelled`,
    metadata: {
      email,
      plan: subscriptionData.plan,
      isGuest: subscriptionData.isGuest ? 'true' : 'false',
      priceId: priceId,
      description: planConfig.description
    },
    subscription_data: {
      metadata: {
        email,
        plan: subscriptionData.plan,
        isGuest: subscriptionData.isGuest ? 'true' : 'false'
      }
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
    // Rate limiting check
    const clientIP = event.headers['x-forwarded-for']?.split(',')[0]?.trim() || 
                     event.headers['x-real-ip'] || 
                     event.headers['cf-connecting-ip'] || 
                     'unknown';
                     
    if (!checkRateLimit(clientIP)) {
      return {
        statusCode: 429,
        headers: { 
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*"
        },
        body: JSON.stringify({ error: 'Rate limit exceeded. Please try again in a minute.' }),
      };
    }

    const body = JSON.parse(event.body);
    
    // Input validation
    if (!body.plan || !['monthly', 'yearly'].includes(body.plan)) {
      throw new Error('Invalid subscription plan. Must be "monthly" or "yearly"');
    }
    
    const { plan, isGuest = false } = body;
    let guestEmail = body.guestEmail ? sanitizeInput(body.guestEmail) : '';
    let userEmail = body.userEmail ? sanitizeInput(body.userEmail) : '';

    let email = guestEmail || userEmail;

    // For authenticated users, get email from Supabase auth token
    if (!isGuest && !email) {
      const authHeader = event.headers.authorization || event.headers.Authorization;
      if (authHeader && authHeader.startsWith('Bearer ')) {
        try {
          // Initialize Supabase client for auth validation
          const supabaseUrl = process.env.SUPABASE_URL || 'https://dfhanacsmsvvkpunurnp.supabase.co';
          const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

          if (supabaseServiceKey) {
            const supabaseClient = createClient(supabaseUrl, supabaseServiceKey, {
              auth: { persistSession: false }
            });

            const token = authHeader.replace('Bearer ', '');
            const { data: userData, error: userError } = await supabaseClient.auth.getUser(token);

            if (!userError && userData.user?.email) {
              email = userData.user.email;
              console.log('✅ Extracted email from auth token:', email);
            } else {
              console.warn('⚠️ Failed to get user from auth token:', userError?.message);
            }
          }
        } catch (authError) {
          console.warn('⚠️ Auth token processing failed:', authError.message);
        }
      }
    }

    if (!email) {
      throw new Error("Email is required for subscription");
    }

    if (isGuest && (!guestEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(guestEmail))) {
      throw new Error('Valid email address is required');
    }

    const originUrl = event.headers.origin || event.headers.referer || "https://backlinkoo.com";

    // Currently only supporting Stripe for subscriptions
    const result = await createStripeSubscription(body, email, originUrl);

    // TODO: Store subscription intent in database for tracking
    console.log(`Subscription initiated: ${plan} - ${email}`);

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
