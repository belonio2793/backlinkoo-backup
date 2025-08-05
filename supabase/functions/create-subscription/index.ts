import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@14.21.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface SubscriptionRequest {
  priceId: string;
  tier: string;
  isGuest?: boolean;
  guestEmail?: string;
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
  console.log(`🚀 Edge function called: ${req.method} ${req.url}`);

  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  // Check environment variables first
  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  const stripeSecretKey = Deno.env.get("STRIPE_SECRET_KEY");

  console.log("🔧 Environment check:", {
    supabaseUrl: !!supabaseUrl,
    supabaseServiceKey: !!supabaseServiceKey,
    stripeSecretKey: !!stripeSecretKey
  });

  if (!supabaseUrl || !supabaseServiceKey) {
    console.error("Missing Supabase configuration");
    return new Response(
      JSON.stringify({ error: "Service configuration error" }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  if (!stripeSecretKey) {
    console.error("Missing Stripe configuration");
    return new Response(
      JSON.stringify({ error: "Payment system not configured" }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  const supabaseClient = createClient(supabaseUrl, supabaseServiceKey, {
    auth: { persistSession: false }
  });

  try {
    // Rate limiting check
    const clientIP = req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || 'unknown';
    if (!checkRateLimit(clientIP)) {
      return new Response(
        JSON.stringify({ error: 'Rate limit exceeded' }),
        { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    let body: SubscriptionRequest;
    try {
      const rawBody = await req.text();
      console.log("📝 Raw request body:", rawBody);
      body = JSON.parse(rawBody);
      console.log("📋 Parsed request body:", body);
    } catch (parseError) {
      console.error("❌ JSON parse error:", parseError);
      return new Response(
        JSON.stringify({ error: "Invalid request format", details: parseError.message }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    

    // Input validation
    if (!body.priceId || typeof body.priceId !== 'string' || body.priceId.length > 100) {
      console.error("Invalid price ID:", body.priceId);
      return new Response(
        JSON.stringify({ error: 'Invalid price ID' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!body.tier || body.tier.length > 50) {
      console.error("Invalid tier:", body.tier);
      return new Response(
        JSON.stringify({ error: 'Invalid tier' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    const { priceId, isGuest = false } = body;
    const tier = sanitizeInput(body.tier);
    let guestEmail = body.guestEmail ? sanitizeInput(body.guestEmail) : '';
    
    let user = null;
    let email = guestEmail;

    if (!isGuest) {
      const authHeader = req.headers.get("Authorization");
      if (!authHeader) throw new Error("No authorization header provided");
      
      const token = authHeader.replace("Bearer ", "");
      const { data: userData, error: userError } = await supabaseClient.auth.getUser(token);
      if (userError || !userData.user?.email) {
        throw new Error("User not authenticated");
      }
      user = userData.user;
      email = user.email;
    }

    if (!email) {
      console.error("Email is required for subscription");
      return new Response(
        JSON.stringify({ error: "Email is required for subscription" }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log("Initializing Stripe with email:", email);
    const stripe = new Stripe(stripeSecretKey, {
      apiVersion: "2023-10-16",
    });

    // Check if customer exists
    let customers;
    try {
      customers = await stripe.customers.list({ email, limit: 1 });
    } catch (stripeError) {
      console.error("Stripe customer list error:", stripeError);
      return new Response(
        JSON.stringify({ error: "Payment system error" }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    let customerId;

    if (customers.data.length > 0) {
      customerId = customers.data[0].id;
      console.log("Found existing customer:", customerId);
    } else if (!isGuest) {
      // Create customer for authenticated users
      try {
        const customer = await stripe.customers.create({
          email,
          metadata: { user_id: user?.id || '' }
        });
        customerId = customer.id;
        console.log("Created new customer:", customerId);
      } catch (stripeError) {
        console.error("Stripe customer creation error:", stripeError);
        return new Response(
          JSON.stringify({ error: "Failed to create customer" }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    }

    console.log("Creating checkout session for:", { customerId, email, priceId });

    let session;
    try {
      session = await stripe.checkout.sessions.create({
        customer: customerId,
        customer_email: customerId ? undefined : email,
        line_items: [
          {
            price: priceId,
            quantity: 1,
          },
        ],
        mode: "subscription",
        success_url: `${req.headers.get("origin")}/subscription-success?session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${req.headers.get("origin")}/subscription-cancelled`,
      });
    } catch (stripeError) {
      console.error("Stripe session creation error:", stripeError);
      return new Response(
        JSON.stringify({ error: "Failed to create checkout session" }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Update or create subscriber record
    console.log("Updating subscriber record for:", email);
    const { error: dbError } = await supabaseClient.from("subscribers").upsert({
      user_id: user?.id || null,
      email,
      stripe_customer_id: customerId,
      subscribed: false, // Will be updated when subscription is activated
      subscription_tier: tier,
      payment_method: "stripe",
      guest_checkout: isGuest,
      updated_at: new Date().toISOString(),
    }, { onConflict: 'email' });

    if (dbError) {
      console.error("Database error:", dbError);
      // Don't fail the request for database errors, but log them
    }

    console.log("Successfully created checkout session:", session.id);
    return new Response(JSON.stringify({ url: session.url, sessionId: session.id }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });

  } catch (error) {
    console.error("Error in create-subscription:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
