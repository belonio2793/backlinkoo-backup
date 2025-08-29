import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@14.21.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

interface SubscriptionRequest {
  plan: "monthly" | "yearly" | "annual";
  tier?: string;
  isGuest?: boolean;
  guestEmail?: string;
  userEmail?: string;
}

// Simple in-memory rate limit (use Redis in production)
const rateLimitMap = new Map<string, { count: number; resetTime: number }>();
function checkRateLimit(identifier: string): boolean {
  const now = Date.now();
  const windowMs = 60_000; // 1 minute
  const maxRequests = 5;
  const record = rateLimitMap.get(identifier);
  if (!record || now > record.resetTime) {
    rateLimitMap.set(identifier, { count: 1, resetTime: now + windowMs });
    return true;
  }
  if (record.count >= maxRequests) return false;
  record.count++;
  return true;
}

function sanitizeInput(input: string): string {
  return input.replace(/[<>'"&]/g, "").trim();
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  const stripeSecretKey = Deno.env.get("STRIPE_SECRET_KEY");

  if (!supabaseUrl || !supabaseServiceKey) {
    return new Response(
      JSON.stringify({ error: "Service configuration error. Please contact support." }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }

  if (!stripeSecretKey || (!stripeSecretKey.startsWith("sk_live_") && !stripeSecretKey.startsWith("sk_test_"))) {
    return new Response(
      JSON.stringify({ error: "Payment system not configured. Please contact support." }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }

  const supabase = createClient(supabaseUrl, supabaseServiceKey, { auth: { persistSession: false } });

  try {
    const clientIP = req.headers.get("x-forwarded-for") || req.headers.get("x-real-ip") || "unknown";
    if (!checkRateLimit(clientIP)) {
      return new Response(
        JSON.stringify({ error: "Too many requests. Please wait a moment and try again." }),
        { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    // Parse body
    let body: SubscriptionRequest;
    try {
      body = await req.json();
    } catch {
      return new Response(
        JSON.stringify({ error: "Invalid request format" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    // Validate input
    if (!body.plan || !["monthly", "yearly", "annual"].includes(body.plan)) {
      return new Response(
        JSON.stringify({ error: 'Invalid subscription plan. Must be "monthly", "yearly", or "annual"' }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const plan = body.plan === "annual" ? "yearly" : body.plan;
    const tier = body.tier ? sanitizeInput(body.tier) : "premium";
    const isGuest = !!body.isGuest;
    let guestEmail = body.guestEmail ? sanitizeInput(body.guestEmail) : "";
    let userEmail = body.userEmail ? sanitizeInput(body.userEmail) : "";

    // Resolve email (auth, fallback to provided)
    let user: any = null;
    let email = "";
    if (!isGuest) {
      const authHeader = req.headers.get("Authorization");
      if (authHeader?.startsWith("Bearer ")) {
        try {
          const token = authHeader.replace("Bearer ", "");
          const { data: userData } = await supabase.auth.getUser(token);
          if (userData?.user?.email) {
            user = userData.user;
            email = userData.user.email;
          }
        } catch {
          /* ignore */
        }
      }
      if (!email && userEmail) email = userEmail;
    } else {
      email = guestEmail;
    }

    if (!email) {
      return new Response(
        JSON.stringify({ error: "Email is required for subscription" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return new Response(
        JSON.stringify({ error: "Valid email address is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const stripe = new Stripe(stripeSecretKey, { apiVersion: "2023-10-16" });

    // Product for premium subscriptions
    const PREMIUM_PRODUCT_ID = "prod_SoVja4018pbOcy";

    // Find or create customer (for authenticated users)
    let customerId: string | undefined;
    try {
      const customers = await stripe.customers.list({ email, limit: 1 });
      if (customers.data.length > 0) {
        customerId = customers.data[0].id;
      } else if (!isGuest) {
        const customer = await stripe.customers.create({
          email,
          metadata: { user_id: user?.id || "" },
        });
        customerId = customer.id;
      }
    } catch (e) {
      return new Response(
        JSON.stringify({ error: "Failed to manage customer account. Please try again." }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    // Determine price per plan
    const priceAmount = plan === "monthly" ? 2900 : 29000; // cents
    const interval: "month" | "year" = plan === "monthly" ? "month" : "year";

    // Create checkout session with dynamic price_data
    const origin = req.headers.get("origin") || "https://backlinkoo.com";
    let session;
    try {
      session = await stripe.checkout.sessions.create({
        customer: customerId,
        customer_email: customerId ? undefined : email,
        line_items: [
          {
            price_data: {
              currency: "usd",
              product: PREMIUM_PRODUCT_ID,
              recurring: { interval },
              unit_amount: priceAmount,
            },
            quantity: 1,
          },
        ],
        metadata: {
          plan,
          tier,
          product_type: "premium_subscription",
          is_guest: String(isGuest),
          guest_email: isGuest ? email : "",
          product_id: PREMIUM_PRODUCT_ID,
        },
        mode: "subscription",
        success_url: `${origin}/subscription-success?session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${origin}/subscription-cancelled`,
      });
    } catch (err: any) {
      return new Response(
        JSON.stringify({ error: "Failed to create subscription checkout. Please try again.", details: err?.message }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    // Record intent (non-blocking)
    try {
      await supabase
        .from("subscribers")
        .upsert(
          {
            user_id: user?.id || null,
            email,
            stripe_customer_id: customerId,
            stripe_session_id: session.id,
            subscribed: false,
            subscription_tier: tier,
            subscription_plan: plan,
            payment_method: "stripe",
            product_id: PREMIUM_PRODUCT_ID,
            guest_checkout: isGuest,
            updated_at: new Date().toISOString(),
          },
          { onConflict: "email" },
        );
    } catch {
      /* ignore non-critical DB errors */
    }

    return new Response(
      JSON.stringify({ url: session.url, sessionId: session.id, plan, productId: PREMIUM_PRODUCT_ID }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (error: any) {
    const msg = error?.message || "An unexpected error occurred. Please try again.";
    return new Response(
      JSON.stringify({ error: msg, code: "SUBSCRIPTION_ERROR", timestamp: new Date().toISOString(), productId: "prod_SoVja4018pbOcy" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
