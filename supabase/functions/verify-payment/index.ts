import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@14.21.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

type VerifyType = "payment" | "subscription";

interface VerifyRequest {
  type: VerifyType;
  sessionId?: string; // Stripe Checkout Session ID
  subscriptionId?: string; // Optional direct subscription id
  customerId?: string; // Optional stripe customer id (fallback)
}

// Simple in-memory rate limit (use Redis in production)
const rateLimitMap = new Map<string, { count: number; resetTime: number }>();
function checkRateLimit(identifier: string): boolean {
  const now = Date.now();
  const windowMs = 60_000; // 1 minute
  const maxRequests = 20;
  const record = rateLimitMap.get(identifier);
  if (!record || now > record.resetTime) {
    rateLimitMap.set(identifier, { count: 1, resetTime: now + windowMs });
    return true;
  }
  if (record.count >= maxRequests) return false;
  record.count++;
  return true;
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

  if (!supabaseUrl || !supabaseServiceKey || !stripeSecretKey) {
    return new Response(
      JSON.stringify({ error: "Missing environment configuration" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }

  const supabase = createClient(supabaseUrl, supabaseServiceKey, { auth: { persistSession: false } });
  const stripe = new Stripe(stripeSecretKey, { apiVersion: "2023-10-16" });

  try {
    const clientIP = req.headers.get("x-forwarded-for") || req.headers.get("x-real-ip") || "unknown";
    if (!checkRateLimit(clientIP)) {
      return new Response(
        JSON.stringify({ error: "Rate limit exceeded" }),
        { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    let body: VerifyRequest;
    try {
      body = await req.json();
    } catch {
      return new Response(
        JSON.stringify({ error: "Invalid request format" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    if (!body.type || (body.type !== "payment" && body.type !== "subscription")) {
      return new Response(
        JSON.stringify({ error: 'Invalid type. Use "payment" or "subscription"' }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    // PAYMENT VERIFICATION
    if (body.type === "payment") {
      if (!body.sessionId) {
        return new Response(
          JSON.stringify({ error: "sessionId is required for payment verification" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
        );
      }

      const session = await stripe.checkout.sessions.retrieve(body.sessionId, {
        expand: ["payment_intent", "line_items"],
      });

      const paid = session.payment_status === "paid" || (session.payment_intent && (session.payment_intent as any).status === "succeeded");

      // Update orders status (non-blocking if it fails)
      try {
        await supabase
          .from("orders")
          .update({
            status: paid ? "completed" : "failed",
            updated_at: new Date().toISOString(),
          })
          .eq("stripe_session_id", body.sessionId);
      } catch (_) {}

      // Allocate credits when paid
      let allocatedCredits = 0;
      let orderId: string | null = null;
      try {
        if (paid) {
          const metadata: Record<string, string> = (session.metadata || {}) as Record<string, string>;
          const credits = parseInt(String(metadata.credits || '0'));
          if (credits > 0) {
            // Find order and user
            const { data: order } = await supabase
              .from('orders')
              .select('id, user_id, email')
              .eq('stripe_session_id', body.sessionId)
              .maybeSingle();
            orderId = order?.id || null;
            let userId = order?.user_id as string | null;
            const email = (order?.email || session.customer_details?.email || '').toLowerCase();
            if (!userId && email) {
              const { data: profile } = await supabase
                .from('profiles')
                .select('user_id')
                .eq('email', email)
                .maybeSingle();
              userId = (profile?.user_id as string) || null;
            }
            if (userId) {
              // Upsert credits
              const { data: current } = await supabase
                .from('credits')
                .select('amount, total_purchased')
                .eq('user_id', userId)
                .maybeSingle();

              if (current) {
                await supabase
                  .from('credits')
                  .update({
                    amount: (current.amount || 0) + credits,
                    total_purchased: (current.total_purchased || 0) + credits,
                    updated_at: new Date().toISOString(),
                  })
                  .eq('user_id', userId);
              } else {
                await supabase
                  .from('credits')
                  .insert({
                    user_id: userId,
                    amount: credits,
                    total_purchased: credits,
                    total_used: 0,
                    created_at: new Date().toISOString(),
                    updated_at: new Date().toISOString(),
                  });
              }

              // Insert transaction (idempotent by order_id)
              if (orderId) {
                const { data: existing } = await supabase
                  .from('credit_transactions')
                  .select('id')
                  .eq('order_id', orderId)
                  .limit(1);
                if (!existing || existing.length === 0) {
                  await supabase
                    .from('credit_transactions')
                    .insert({
                      user_id: userId,
                      amount: credits,
                      type: 'purchase',
                      order_id: orderId,
                      description: (metadata.product_name as string) || 'Credits purchase',
                      created_at: new Date().toISOString(),
                    });
                }
              }

              allocatedCredits = credits;
            }
          }
        }
      } catch (_) {}

      return new Response(
        JSON.stringify({
          success: true,
          paid,
          status: session.payment_status,
          amount_total: session.amount_total,
          currency: session.currency,
          credits: allocatedCredits || undefined,
          order_id: orderId || undefined,
        }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    // SUBSCRIPTION VERIFICATION
    // Try in order: explicit subscriptionId -> sessionId -> customerId
    let subscriptionId = body.subscriptionId;
    let customerId = body.customerId as string | undefined;

    if (!subscriptionId && body.sessionId) {
      const session = await stripe.checkout.sessions.retrieve(body.sessionId);
      if (session.subscription) {
        subscriptionId = String(session.subscription);
      }
      if (!customerId && session.customer) {
        customerId = String(session.customer);
      }
    }

    let subscription: Stripe.Subscription | null = null;
    if (subscriptionId) {
      subscription = await stripe.subscriptions.retrieve(subscriptionId);
    } else if (customerId) {
      const subs = await stripe.subscriptions.list({ customer: customerId, status: "all", limit: 1 });
      subscription = subs.data[0] || null;
    } else {
      return new Response(
        JSON.stringify({ error: "Provide sessionId, subscriptionId, or customerId for subscription verification" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    if (!subscription) {
      return new Response(
        JSON.stringify({ error: "Subscription not found" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const isActive = subscription.status === "active" || subscription.status === "trialing";

    // Update subscribers table (non-blocking if it fails)
    try {
      const periodEnd = subscription.current_period_end ? new Date(subscription.current_period_end * 1000).toISOString() : null;
      const update = {
        stripe_customer_id: subscription.customer as string,
        stripe_subscription_id: subscription.id,
        subscribed: isActive,
        subscription_tier: "premium",
        status: subscription.status,
        current_period_end: periodEnd,
        updated_at: new Date().toISOString(),
      } as Record<string, unknown>;

      // Try update by stripe_customer_id first
      let { error } = await supabase
        .from("subscribers")
        .update(update)
        .eq("stripe_customer_id", subscription.customer as string);

      // If no row updated, try by email from latest invoice customer_details
      if (error || (error === null)) {
        const invoiceId = (subscription.latest_invoice as string) || undefined;
        if (invoiceId) {
          const invoice = await stripe.invoices.retrieve(invoiceId);
          const email = invoice.customer_email || invoice.customer_address?.name || undefined;
          if (email) {
            await supabase
              .from("subscribers")
              .upsert({
                email,
                stripe_customer_id: subscription.customer as string,
                stripe_subscription_id: subscription.id,
                subscribed: isActive,
                subscription_tier: "premium",
                status: subscription.status,
                current_period_end: periodEnd,
                updated_at: new Date().toISOString(),
              }, { onConflict: "email" });
          }
        }
      }
    } catch (_) {}

    return new Response(
      JSON.stringify({
        success: true,
        subscribed: isActive,
        status: subscription.status,
        subscription_id: subscription.id,
        customer_id: subscription.customer,
        current_period_end: subscription.current_period_end ? new Date(subscription.current_period_end * 1000).toISOString() : null,
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (error: any) {
    return new Response(
      JSON.stringify({ error: error?.message || "Verification failed" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
