import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@14.21.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS"
};

interface VerifyRequest {
  sessionId?: string;
  paypalOrderId?: string;
  type: 'payment' | 'subscription';
}

// Rate limiting map
const rateLimitMap = new Map<string, { count: number, resetTime: number }>();

function checkRateLimit(identifier: string): boolean {
  const now = Date.now();
  const windowMs = 60000; // 1 minute
  const maxRequests = 20; // Higher limit for verification
  
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

serve(async (req) => {
  console.log(`🚀 Payment Verification Edge Function: ${req.method} ${req.url}`);

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
    stripeSecretKey: !!stripeSecretKey
  });

  if (!supabaseUrl || !supabaseServiceKey) {
    console.error("❌ Missing Supabase configuration");
    return new Response(
      JSON.stringify({ error: "Service configuration error" }),
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
    let body: VerifyRequest;
    try {
      const rawBody = await req.text();
      console.log("📝 Raw request body:", rawBody);
      body = JSON.parse(rawBody);
      console.log("📋 Parsed request body:", body);
    } catch (parseError) {
      console.error("❌ JSON parse error:", parseError);
      return new Response(
        JSON.stringify({ error: "Invalid request format" }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    // Input validation
    if (!body.type || !['payment', 'subscription'].includes(body.type)) {
      console.error("❌ Invalid verification type:", body.type);
      return new Response(
        JSON.stringify({ error: 'Invalid verification type. Must be "payment" or "subscription"' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    if (!body.sessionId && !body.paypalOrderId) {
      console.error("❌ Missing session ID or PayPal order ID");
      return new Response(
        JSON.stringify({ error: 'Session ID or PayPal order ID is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    const { sessionId, paypalOrderId, type } = body;

    if (sessionId) {
      // Verify Stripe payment/subscription
      if (!stripeSecretKey) {
        console.error("❌ Stripe secret key not configured");
        return new Response(
          JSON.stringify({ error: "Payment verification not available" }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      const stripe = new Stripe(stripeSecretKey, {
        apiVersion: "2023-10-16",
      });

      let session;
      try {
        session = await stripe.checkout.sessions.retrieve(sessionId);
        console.log("✅ Retrieved Stripe session:", session.id, "Status:", session.payment_status);
      } catch (stripeError) {
        console.error("❌ Failed to retrieve Stripe session:", stripeError);
        return new Response(
          JSON.stringify({ error: "Failed to verify payment session" }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      
      if (type === 'payment') {
        // Handle credit payment verification
        try {
          const { error: updateError } = await supabaseClient
            .from("orders")
            .update({ 
              status: session.payment_status === 'paid' ? 'paid' : 'failed',
              updated_at: new Date().toISOString() 
            })
            .eq("stripe_session_id", sessionId);

          if (updateError) {
            console.error("⚠️ Error updating order (non-critical):", updateError);
          } else {
            console.log("✅ Order status updated");
          }
        } catch (dbError) {
          console.error("⚠️ Database error (non-critical):", dbError);
        }

        return new Response(JSON.stringify({ 
          status: session.payment_status,
          paid: session.payment_status === 'paid',
          session_id: session.id
        }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 200,
        });

      } else if (type === 'subscription') {
        // Handle subscription verification
        if (session.subscription) {
          let subscription;
          try {
            subscription = await stripe.subscriptions.retrieve(session.subscription as string);
            console.log("✅ Retrieved subscription:", subscription.id, "Status:", subscription.status);
          } catch (stripeError) {
            console.error("❌ Failed to retrieve subscription:", stripeError);
            return new Response(
              JSON.stringify({ error: "Failed to verify subscription" }),
              { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            );
          }

          const customerId = session.customer as string;
          
          // Update subscriber status
          try {
            const { error: updateError } = await supabaseClient
              .from("subscribers")
              .update({
                stripe_customer_id: customerId,
                stripe_subscription_id: subscription.id,
                subscribed: subscription.status === 'active',
                subscription_end: new Date(subscription.current_period_end * 1000).toISOString(),
                updated_at: new Date().toISOString()
              })
              .eq("stripe_session_id", sessionId);

            if (updateError) {
              console.error("⚠️ Error updating subscription (non-critical):", updateError);
            } else {
              console.log("✅ Subscription status updated");
            }
          } catch (dbError) {
            console.error("⚠️ Database error (non-critical):", dbError);
          }

          return new Response(JSON.stringify({
            status: subscription.status,
            subscribed: subscription.status === 'active',
            subscription_end: new Date(subscription.current_period_end * 1000).toISOString(),
            subscription_id: subscription.id
          }), {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
            status: 200,
          });
        } else {
          console.error("❌ No subscription found in session");
          return new Response(
            JSON.stringify({ error: "No subscription found in payment session" }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }
      }

    } else if (paypalOrderId) {
      // Verify PayPal payment
      const paypalClientId = Deno.env.get("PAYPAL_CLIENT_ID");
      const paypalSecret = Deno.env.get("PAYPAL_SECRET_KEY");
      
      if (!paypalClientId || !paypalSecret) {
        console.error("❌ PayPal configuration missing");
        return new Response(
          JSON.stringify({ error: "PayPal verification not available" }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      try {
        // Get PayPal access token
        const authResponse = await fetch("https://api.paypal.com/v1/oauth2/token", {
          method: "POST",
          headers: {
            "Content-Type": "application/x-www-form-urlencoded",
            "Authorization": `Basic ${btoa(`${paypalClientId}:${paypalSecret}`)}`,
          },
          body: "grant_type=client_credentials",
        });

        if (!authResponse.ok) {
          throw new Error("PayPal authentication failed");
        }

        const authData = await authResponse.json();

        // Get order details
        const orderResponse = await fetch(`https://api.paypal.com/v2/checkout/orders/${paypalOrderId}`, {
          headers: {
            "Authorization": `Bearer ${authData.access_token}`,
          },
        });

        if (!orderResponse.ok) {
          throw new Error("PayPal order retrieval failed");
        }

        const orderData = await orderResponse.json();
        const isPaid = orderData.status === 'COMPLETED';

        console.log("✅ PayPal order status:", orderData.status);

        // Update order status
        try {
          const { error: updateError } = await supabaseClient
            .from("orders")
            .update({ 
              status: isPaid ? 'paid' : 'pending',
              updated_at: new Date().toISOString() 
            })
            .eq("paypal_order_id", paypalOrderId);

          if (updateError) {
            console.error("⚠️ Error updating PayPal order (non-critical):", updateError);
          } else {
            console.log("✅ PayPal order status updated");
          }
        } catch (dbError) {
          console.error("⚠️ Database error (non-critical):", dbError);
        }

        return new Response(JSON.stringify({ 
          status: orderData.status,
          paid: isPaid,
          order_id: paypalOrderId
        }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 200,
        });

      } catch (paypalError) {
        console.error("❌ PayPal verification error:", paypalError);
        return new Response(
          JSON.stringify({ error: "PayPal verification failed" }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    }

    console.error("❌ No valid payment method provided");
    return new Response(
      JSON.stringify({ error: "No valid payment method provided for verification" }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error("❌ Unhandled error in verify-payment:", error);
    console.error("❌ Error stack:", error.stack);

    return new Response(JSON.stringify({ 
      error: "Payment verification failed. Please try again or contact support.",
      timestamp: new Date().toISOString()
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
