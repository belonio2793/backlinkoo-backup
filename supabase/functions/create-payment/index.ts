import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@14.21.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS"
};

interface PaymentRequest {
  amount: number;
  credits: number;
  productName?: string;
  isGuest?: boolean;
  guestEmail?: string;
  paymentMethod?: string;
}

// Rate limiting map (in production, use Redis or similar)
const rateLimitMap = new Map<string, { count: number, resetTime: number }>();

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

serve(async (req) => {
  console.log(`🚀 Credit Payment Edge Function: ${req.method} ${req.url}`);

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
    let body: PaymentRequest;
    try {
      const rawBody = await req.text();
      console.log("📝 Raw request body:", rawBody.substring(0, 200) + "...");
      body = JSON.parse(rawBody);
      console.log("📋 Parsed request body:", { 
        ...body, 
        guestEmail: body.guestEmail ? '[REDACTED]' : undefined 
      });
    } catch (parseError) {
      console.error("❌ JSON parse error:", parseError);
      return new Response(
        JSON.stringify({ error: "Invalid request format", details: "Please check your request data" }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Input validation
    if (!body.amount || typeof body.amount !== 'number' || body.amount <= 0 || body.amount > 10000) {
      console.error("❌ Invalid amount:", body.amount);
      return new Response(
        JSON.stringify({ error: 'Invalid amount. Must be between $0.01 and $10,000' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!body.credits || typeof body.credits !== 'number' || body.credits <= 0 || body.credits > 10000) {
      console.error("❌ Invalid credits:", body.credits);
      return new Response(
        JSON.stringify({ error: 'Invalid credits. Must be between 1 and 10,000 credits' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { amount, credits, isGuest = false } = body;
    const productName = body.productName ? sanitizeInput(body.productName) : `${credits} Backlink Credits`;
    let guestEmail = body.guestEmail ? sanitizeInput(body.guestEmail) : '';
    
    let user = null;
    let email = guestEmail;

    // Handle authentication for non-guest users
    if (!isGuest) {
      const authHeader = req.headers.get("Authorization");
      if (authHeader && authHeader.startsWith("Bearer ")) {
        try {
          const token = authHeader.replace("Bearer ", "");
          const { data: userData, error: userError } = await supabaseClient.auth.getUser(token);
          if (!userError && userData.user?.email) {
            user = userData.user;
            email = userData.user.email;
            console.log("✅ Authenticated user:", email);
          } else {
            console.warn("⚠️ Auth failed, treating as guest:", userError?.message);
          }
        } catch (authError) {
          console.warn("⚠️ Auth error, treating as guest:", authError);
        }
      } else {
        console.warn("⚠️ No auth header, treating as guest");
      }
    }

    // Email validation
    if (!email) {
      console.error("❌ No email provided");
      return new Response(
        JSON.stringify({ error: "Email is required for payment processing" }),
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

    console.log("💳 Processing payment for:", email, "Credits:", credits, "Amount:", amount);

    // Initialize Stripe
    const stripe = new Stripe(stripeSecretKey, {
      apiVersion: "2023-10-16",
    });

    // Use live Stripe product ID for credits
    const CREDITS_PRODUCT_ID = "prod_SoVoAb8dXp1cS0";

    // Check if customer exists
    let customerId;
    if (!isGuest) {
      try {
        const customers = await stripe.customers.list({ email, limit: 1 });
        if (customers.data.length > 0) {
          customerId = customers.data[0].id;
          console.log("✅ Found existing customer:", customerId);
        }
      } catch (stripeError) {
        console.warn("⚠️ Could not check for existing customer:", stripeError.message);
      }
    }

    // Create Stripe checkout session
    console.log("🔄 Creating Stripe checkout session...");
    const sessionData = {
      customer: customerId,
      customer_email: customerId ? undefined : email,
      line_items: [
        {
          price_data: {
            currency: "usd",
            product: CREDITS_PRODUCT_ID,
            unit_amount: Math.round(amount * 100), // Convert to cents
          },
          quantity: 1,
        },
      ],
      metadata: {
        credits: credits.toString(),
        product_type: "credits",
        is_guest: isGuest.toString(),
        guest_email: isGuest ? email : "",
        product_name: productName
      },
      mode: "payment" as const,
      success_url: `${req.headers.get("origin")}/payment-success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${req.headers.get("origin")}/payment-cancelled`,
    };

    let session;
    try {
      session = await stripe.checkout.sessions.create(sessionData);
      console.log("✅ Stripe session created:", session.id);
    } catch (stripeError) {
      console.error("❌ Stripe session creation failed:", stripeError);
      return new Response(
        JSON.stringify({ 
          error: "Failed to create checkout session. Please try again or contact support.",
          details: stripeError.message 
        }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Record order in database
    try {
      const { error: dbError } = await supabaseClient.from("orders").insert({
        user_id: user?.id || null,
        email,
        stripe_session_id: session.id,
        amount: Math.round(amount * 100), // Store in cents
        credits: credits,
        status: "pending",
        payment_method: "stripe",
        product_name: productName,
        product_id: CREDITS_PRODUCT_ID,
        guest_checkout: isGuest,
        created_at: new Date().toISOString(),
      });

      if (dbError) {
        console.error("⚠️ Database insert error (non-critical):", dbError);
        // Don't fail the payment for database issues
      } else {
        console.log("✅ Order recorded in database");
      }
    } catch (dbError) {
      console.error("⚠️ Database error (non-critical):", dbError);
      // Don't fail the payment for database issues
    }

    console.log("🎉 Payment session created successfully");
    return new Response(JSON.stringify({ 
      url: session.url, 
      sessionId: session.id,
      productId: CREDITS_PRODUCT_ID 
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });

  } catch (error) {
    console.error("❌ Unhandled error in create-payment:", error);
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
      code: error.code || 'PAYMENT_ERROR',
      timestamp: new Date().toISOString(),
      productId: 'prod_SoVoAb8dXp1cS0'
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
