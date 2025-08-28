import Stripe from "stripe";
import { createClient } from '@supabase/supabase-js';

// Rate limiting map (in production, use Redis or similar)
const rateLimitMap = new Map();

function checkRateLimit(identifier: string): boolean {
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

function sanitizeInput(input: string): string {
  return input.replace(/[<>'"&]/g, '').trim();
}

// Initialize Supabase client for database operations
function getSupabaseClient() {
  const supabaseUrl = Deno.env.get('VITE_SUPABASE_URL');
  const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

  if (!supabaseUrl || !supabaseServiceKey) {
    console.warn("Supabase configuration missing - order tracking disabled");
    return null;
  }

  return createClient(supabaseUrl, supabaseServiceKey, {
    auth: { persistSession: false }
  });
}

async function createStripePayment(paymentData: any, email: string, originUrl: string) {
  const stripeSecretKey = Deno.env.get('STRIPE_SECRET_KEY');

  // Validate Stripe configuration
  if (!stripeSecretKey || !stripeSecretKey.startsWith('sk_')) {
    throw new Error("STRIPE_SECRET_KEY is required and must be a valid Stripe secret key");
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

export default async (request: Request): Promise<Response> => {
  // Handle CORS preflight
  if (request.method === "OPTIONS") {
    return new Response(null, {
      status: 200,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "POST, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type, Authorization",
      },
    });
  }

  if (request.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { 
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*"
      },
    });
  }

  try {
    // Rate limiting check
    const clientIP = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 
                     request.headers.get('x-real-ip') || 
                     request.headers.get('cf-connecting-ip') || 
                     'unknown';
    
    if (!checkRateLimit(clientIP)) {
      return new Response(JSON.stringify({ error: 'Rate limit exceeded. Please try again in a minute.' }), {
        status: 429,
        headers: { 
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*"
        },
      });
    }

    const body = await request.json();
    
    // Input validation
    if (!body.amount || body.amount <= 0 || body.amount > 10000) {
      throw new Error('Invalid amount. Must be between $0.01 and $10,000');
    }
    
    if (!body.productName || body.productName.length > 200) {
      throw new Error('Invalid product name');
    }

    if (body.paymentMethod !== 'stripe') {
      throw new Error('Only Stripe payments are supported');
    }
    
    const { amount, isGuest = false, paymentMethod } = body;
    const productName = sanitizeInput(body.productName);
    let guestEmail = body.guestEmail ? sanitizeInput(body.guestEmail) : '';
    
    let email = guestEmail;

    // For authenticated users, we should get email from auth header in production
    // For now, we'll use the guest email or require it
    if (!isGuest && !email) {
      throw new Error("Email is required for payment processing");
    }

    if (isGuest && (!guestEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(guestEmail))) {
      throw new Error('Valid email address is required');
    }

    const originUrl = request.headers.get('origin') || request.headers.get('referer') || "https://backlinkoo.com";
    
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
            amount: Math.round(body.amount * 100), // Convert to cents
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

    return new Response(JSON.stringify(result), {
      status: 200,
      headers: { 
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*"
      },
    });

  } catch (error) {
    console.error("Payment creation error:", error);

    // Provide user-friendly error messages
    let userMessage = error.message || 'Payment processing failed. Please try again.';

    // Handle specific Stripe errors
    if (error.message?.includes('Invalid amount')) {
      if (error.message?.includes('Must be between')) {
        // This is likely a Stripe account limit
        userMessage = 'Payment amount exceeds your account limit. Please try a smaller amount or contact support to increase your limit.';
      }
    } else if (error.message?.includes('Your account cannot currently make live charges')) {
      userMessage = 'Account verification required. Please contact support to enable payments.';
    } else if (error.message?.includes('rate limit') || error.message?.includes('too many requests')) {
      userMessage = 'Too many payment requests. Please wait a moment and try again.';
    } else if (error.message?.includes('card') || error.message?.includes('payment_method')) {
      userMessage = 'Payment method error. Please check your card details or try a different payment method.';
    }

    return new Response(JSON.stringify({
      error: userMessage,
      details: Deno.env.get('NODE_ENV') === 'development' ? error.stack : undefined
    }), {
      status: 500,
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*"
      },
    });
  }
};
