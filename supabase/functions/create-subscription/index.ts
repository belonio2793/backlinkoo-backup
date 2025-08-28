import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@14.21.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS"
};

interface SubscriptionRequest {
  plan: 'monthly' | 'yearly' | 'annual';
  tier?: string;
  isGuest?: boolean;
  guestEmail?: string;
  userEmail?: string;
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

serve(async (req) => {
  console.log(`🚀 Premium Subscription Edge Function: ${req.method} ${req.url}`);

  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  // Only allow POST requests
  if (req.method !== "POST") {
    return new Response(
      JSON.stringify({ error: "Method not allowed" }),
      { status: 405, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  // Check environment variables
  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  const stripeSecretKey = Deno.env.get("STRIPE_SECRET_KEY");

  console.log("🔧 Environment check:", {
    supabaseUrl: !!supabaseUrl,
    supabaseServiceKey: !!supabaseServiceKey,
    stripeSecretKey: !!stripeSecretKey,
    stripeKeyType: stripeSecretKey?.startsWith('sk_live_') ? 'live' : stripeSecretKey?.startsWith('sk_test_') ? 'test' : 'invalid'
  });

  if (!supabaseUrl || !supabaseServiceKey) {
    console.error("❌ Missing Supabase configuration");
    return new Response(
      JSON.stringify({ error: "Service configuration error. Please contact support." }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  if (!stripeSecretKey || (!stripeSecretKey.startsWith('sk_live_') && !stripeSecretKey.startsWith('sk_test_'))) {
    console.error("❌ Invalid Stripe configuration");
    return new Response(
      JSON.stringify({ error: "Payment system not configured. Please contact support." }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  const supabaseClient = createClient(supabaseUrl, supabaseServiceKey, {
    auth: { persistSession: false }
  });

  try {
    // Rate limiting check
    const clientIP = req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || 'unknown';
    console.log("📍 Client IP:", clientIP);
    
    if (!checkRateLimit(clientIP)) {
      console.log("🚫 Rate limit exceeded for IP:", clientIP);
      return new Response(
        JSON.stringify({ error: 'Too many requests. Please wait a moment and try again.' }),
        { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Parse request body
    let body: SubscriptionRequest;
    try {
      const rawBody = await req.text();
      console.log("📝 Raw request body:", rawBody.substring(0, 200) + "...");
      body = JSON.parse(rawBody);
      console.log("📋 Parsed request body:", { 
        ...body, 
        guestEmail: body.guestEmail ? '[REDACTED]' : undefined,
        userEmail: body.userEmail ? '[REDACTED]' : undefined
      });
    } catch (parseError) {
      console.error("❌ JSON parse error:", parseError);
      return new Response(
        JSON.stringify({ error: "Invalid request format", details: "Please check your request data" }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Input validation
    if (!body.plan || !['monthly', 'yearly', 'annual'].includes(body.plan)) {
      console.error("❌ Invalid subscription plan:", body.plan);
      return new Response(
        JSON.stringify({ error: 'Invalid subscription plan. Must be "monthly", "yearly", or "annual"' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    const { isGuest = false } = body;
    const plan = body.plan === 'annual' ? 'yearly' : body.plan; // Normalize annual to yearly
    const tier = body.tier ? sanitizeInput(body.tier) : 'premium';
    let guestEmail = body.guestEmail ? sanitizeInput(body.guestEmail) : '';
    let userEmail = body.userEmail ? sanitizeInput(body.userEmail) : '';

    let user = null;
    let email = '';

    // Handle authentication for non-guest users
    if (!isGuest) {
      const authHeader = req.headers.get("Authorization");
      if (authHeader && authHeader.startsWith('Bearer ')) {
        try {
          const token = authHeader.replace("Bearer ", "");
          const { data: userData, error: userError } = await supabaseClient.auth.getUser(token);
          if (!userError && userData.user?.email) {
            user = userData.user;
            email = user.email;
            console.log('✅ Authenticated user:', email);
          } else {
            console.warn('⚠️ Auth failed:', userError?.message);
          }
        } catch (authError) {
          console.warn('⚠️ Auth error:', authError);
        }
      }

      // Fallback to provided userEmail if auth failed
      if (!email && userEmail) {
        email = userEmail;
        console.log('📧 Using provided userEmail:', email);
      }
    } else {
      // For guest users, use the provided guest email
      email = guestEmail;
      console.log('👤 Using guest email:', email);
    }

    // Email validation
    if (!email) {
      console.error("❌ No email provided");
      return new Response(
        JSON.stringify({
          error: "Email is required for subscription",
          details: {
            isGuest,
            hasGuestEmail: !!guestEmail,
            hasUserEmail: !!userEmail,
            hasAuthHeader: !!req.headers.get("Authorization")
          }
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      console.error("❌ Invalid email format:", email);
      return new Response(
        JSON.stringify({ error: "Valid email address is required" }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log("💳 Processing subscription for:", email, "Plan:", plan, "Tier:", tier);

    // Initialize Stripe
    const stripe = new Stripe(stripeSecretKey, {
      apiVersion: "2023-10-16",
    });

    // Check if customer exists or create one
    let customerId;
    try {
      const customers = await stripe.customers.list({ email, limit: 1 });
      if (customers.data.length > 0) {
        customerId = customers.data[0].id;
        console.log("✅ Found existing customer:", customerId);
      } else if (!isGuest) {
        // Create customer for authenticated users
        const customer = await stripe.customers.create({
          email,
          metadata: { user_id: user?.id || '' }
        });
        customerId = customer.id;
        console.log("✅ Created new customer:", customerId);
      }
    } catch (stripeError) {
      console.error("❌ Stripe customer error:", stripeError);
      return new Response(
        JSON.stringify({ error: "Failed to manage customer account. Please try again." }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Use live Stripe product ID for premium subscriptions
    const PREMIUM_PRODUCT_ID = "prod_SoVja4018pbOcy";

    // Determine pricing based on plan
    let priceAmount: number;
    let interval: 'month' | 'year';

    if (plan === 'monthly') {
      priceAmount = 2900; // $29.00 in cents
      interval = 'month';
    } else { // yearly
      priceAmount = 29000; // $290.00 in cents
      interval = 'year';
    }

    console.log("🔄 Creating Stripe checkout session...", { plan, priceAmount, interval });

    // Create Stripe checkout session
    let session;
    try {
      const sessionData = {
        customer: customerId,
        customer_email: customerId ? undefined : email,
        line_items: [
          {
            price_data: {
              currency: 'usd',
              product: PREMIUM_PRODUCT_ID,
              recurring: {
                interval: interval,
              },
              unit_amount: priceAmount,
            },
            quantity: 1,
          },
        ],
        metadata: {
          plan: plan,
          tier: tier,
          product_type: "premium_subscription",
          is_guest: isGuest.toString(),
          guest_email: isGuest ? email : "",
          product_id: PREMIUM_PRODUCT_ID
        },
        mode: "subscription" as const,
        success_url: `${req.headers.get("origin")}/subscription-success?session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${req.headers.get("origin")}/subscription-cancelled`,
      };

      session = await stripe.checkout.sessions.create(sessionData);
      console.log("✅ Stripe session created:", session.id);
    } catch (stripeError) {
      console.error("❌ Stripe session creation failed:", stripeError);
      return new Response(
        JSON.stringify({ 
          error: "Failed to create subscription checkout. Please try again or contact support.",
          details: stripeError.message 
        }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Record subscription intent in database
    try {
      const { error: dbError } = await supabaseClient.from("subscribers").upsert({
        user_id: user?.id || null,
        email,
        stripe_customer_id: customerId,
        stripe_session_id: session.id,
        subscribed: false, // Will be updated when subscription is activated
        subscription_tier: tier,
        subscription_plan: plan,
        payment_method: "stripe",
        product_id: PREMIUM_PRODUCT_ID,
        guest_checkout: isGuest,
        updated_at: new Date().toISOString(),
      }, { onConflict: 'email' });

      if (dbError) {
        console.error("⚠️ Database upsert error (non-critical):", dbError);
        // Don't fail the subscription for database issues
      } else {
        console.log("✅ Subscription intent recorded in database");
      }
    } catch (dbError) {
      console.error("⚠️ Database error (non-critical):", dbError);
      // Don't fail the subscription for database issues
    }

    console.log("🎉 Subscription session created successfully");
    return new Response(JSON.stringify({ 
      url: session.url, 
      sessionId: session.id,
      plan: plan,
      productId: PREMIUM_PRODUCT_ID
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });

  } catch (error) {
    console.error("❌ Unhandled error in create-subscription:", error);
    console.error("❌ Error stack:", error.stack);

    // Provide user-friendly error messages
    let errorMessage = "An unexpected error occurred. Please try again or contact support.";
    
    if (error.message?.includes("network") || error.message?.includes("fetch")) {
      errorMessage = "Network error. Please check your connection and try again.";
    } else if (error.message?.includes("stripe") || error.message?.includes("Stripe")) {
      errorMessage = "Payment service error. Please try again or contact support.";
    } else if (error.message?.includes("database") || error.message?.includes("supabase")) {
      errorMessage = "Database error. Please try again or contact support.";
    }

    return new Response(JSON.stringify({
      error: errorMessage,
      code: error.code || 'SUBSCRIPTION_ERROR',
      timestamp: new Date().toISOString(),
      productId: "prod_SoVja4018pbOcy"
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
