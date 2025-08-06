const Stripe = require("stripe");
const { createClient } = require('@supabase/supabase-js');

// Rate limiting map (in production, use Redis or similar)
const rateLimitMap = new Map();

function checkRateLimit(identifier) {
  const now = Date.now();
  const windowMs = 60000; // 1 minute
  const maxRequests = 10;
  
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

// Initialize Supabase client for database operations
function getSupabaseClient() {
  const supabaseUrl = process.env.VITE_SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  
  if (!supabaseUrl || !supabaseServiceKey) {
    console.warn("Supabase configuration missing - order tracking disabled");
    return null;
  }
  
  return createClient(supabaseUrl, supabaseServiceKey, {
    auth: { persistSession: false }
  });
}

async function getClientIP(request) {
  const forwarded = request.headers['x-forwarded-for'];
  const realIP = request.headers['x-real-ip'];
  const cfConnectingIP = request.headers['cf-connecting-ip'];
  
  return forwarded?.split(',')[0]?.trim() || realIP || cfConnectingIP || 'unknown';
}

async function createStripePayment(paymentData, email, originUrl) {
  const stripeSecretKey = process.env.STRIPE_SECRET_KEY;

  if (!stripeSecretKey || stripeSecretKey.includes('placeholder')) {
    throw new Error("Stripe is not configured for this environment. Please set up your Stripe API keys or use demo mode.");
  }

  const stripe = new Stripe(stripeSecretKey, {
    apiVersion: "2023-10-16",
  });

  let customerId;
  if (!paymentData.isGuest) {
    const customers = await stripe.customers.list({ email, limit: 1 });
    if (customers.data.length > 0) {
      customerId = customers.data[0].id;
    }
  }

  // Create checkout session with dynamic product
  const session = await stripe.checkout.sessions.create({
    customer: customerId,
    customer_email: customerId ? undefined : email,
    line_items: [
      {
        price_data: {
          currency: "usd",
          product_data: { 
            name: paymentData.productName,
            metadata: {
              credits: paymentData.credits?.toString() || '0',
              type: 'credits'
            }
          },
          unit_amount: Math.round(paymentData.amount * 100), // Convert to cents
        },
        quantity: 1,
      },
    ],
    mode: "payment",
    success_url: `${originUrl}/payment-success?session_id={CHECKOUT_SESSION_ID}&credits=${paymentData.credits || 0}`,
    cancel_url: `${originUrl}/payment-cancelled`,
    metadata: {
      email,
      credits: paymentData.credits?.toString() || '0',
      isGuest: paymentData.isGuest ? 'true' : 'false',
      productName: paymentData.productName
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
    const { amount, productName, isGuest, guestEmail, paymentMethod, credits } = body;

    // Input validation
    if (!amount || amount <= 0 || amount > 100000) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'Invalid amount. Must be between $0.01 and $100,000.' })
      };
    }

    if (!productName || !productName.trim()) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'Product name is required.' })
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
    
    const result = await createStripePayment(body, email, originUrl);

    // Store order in database for tracking
    try {
      const supabase = getSupabaseClient();
      if (supabase && result.sessionId) {
        await supabase
          .from('orders')
          .insert({
            stripe_session_id: result.sessionId,
            email,
            amount: body.amount * 100, // Convert to cents
            status: 'pending',
            payment_method: 'stripe',
            product_name: body.productName || `${body.credits || 0} Backlink Credits`,
            guest_checkout: body.isGuest || false,
            credits: body.credits || 0,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          });
        console.log(`Order created for payment: ${result.sessionId} - ${email} - $${amount}`);
      }
    } catch (dbError) {
      console.error('Database order creation failed:', dbError);
      // Don't fail the payment creation if database fails
    }

    console.log(`Payment initiated: ${paymentMethod} - ${email} - $${amount}`);

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify(result)
    };

  } catch (error) {
    console.error("Payment creation error:", error);
    
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ 
        error: error.message || 'Payment processing failed. Please try again.',
        details: process.env.NODE_ENV === 'development' ? error.stack : undefined
      })
    };
  }
};
