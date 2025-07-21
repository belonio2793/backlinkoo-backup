import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@14.21.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
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
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseClient = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
    { auth: { persistSession: false } }
  );

  try {
    // Rate limiting check
    const clientIP = req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || 'unknown';
    if (!checkRateLimit(clientIP)) {
      return new Response(
        JSON.stringify({ error: 'Rate limit exceeded' }),
        { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const body: VerifyRequest = await req.json();
    
    // Input validation
    if (!body.type || !['payment', 'subscription'].includes(body.type)) {
      throw new Error('Invalid verification type');
    }
    
    if (!body.sessionId && !body.paypalOrderId) {
      throw new Error('Missing session ID or PayPal order ID');
    }
    
    const { sessionId, paypalOrderId, type } = body;

    if (sessionId) {
      // Verify Stripe payment/subscription
      const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") || "", {
        apiVersion: "2023-10-16",
      });

      const session = await stripe.checkout.sessions.retrieve(sessionId);
      
      if (type === 'payment') {
        // Update order status
        const { error } = await supabaseClient
          .from("orders")
          .update({ 
            status: session.payment_status === 'paid' ? 'paid' : 'failed',
            updated_at: new Date().toISOString() 
          })
          .eq("stripe_session_id", sessionId);

        if (error) {
          console.error("Error updating order:", error);
        }

        return new Response(JSON.stringify({ 
          status: session.payment_status,
          paid: session.payment_status === 'paid'
        }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 200,
        });
      } else {
        // Handle subscription verification
        if (session.subscription) {
          const subscription = await stripe.subscriptions.retrieve(session.subscription as string);
          const customerId = session.customer as string;
          
          // Update subscriber status
          const { error } = await supabaseClient
            .from("subscribers")
            .update({
              stripe_customer_id: customerId,
              stripe_subscription_id: subscription.id,
              subscribed: subscription.status === 'active',
              subscription_end: new Date(subscription.current_period_end * 1000).toISOString(),
              updated_at: new Date().toISOString()
            })
            .eq("stripe_customer_id", customerId);

          if (error) {
            console.error("Error updating subscription:", error);
          }

          return new Response(JSON.stringify({
            status: subscription.status,
            subscribed: subscription.status === 'active',
            subscription_end: new Date(subscription.current_period_end * 1000).toISOString()
          }), {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
            status: 200,
          });
        }
      }
    } else if (paypalOrderId) {
      // Verify PayPal payment
      const paypalClientId = Deno.env.get("PAYPAL_CLIENT_ID");
      const paypalSecret = Deno.env.get("PAYPAL_SECRET_KEY");
      
      // Get PayPal access token
      const authResponse = await fetch("https://api.paypal.com/v1/oauth2/token", {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
          "Authorization": `Basic ${btoa(`${paypalClientId}:${paypalSecret}`)}`,
        },
        body: "grant_type=client_credentials",
      });

      const authData = await authResponse.json();

      // Get order details
      const orderResponse = await fetch(`https://api.paypal.com/v2/checkout/orders/${paypalOrderId}`, {
        headers: {
          "Authorization": `Bearer ${authData.access_token}`,
        },
      });

      const orderData = await orderResponse.json();
      const isPaid = orderData.status === 'COMPLETED';

      // Update order status
      const { error } = await supabaseClient
        .from("orders")
        .update({ 
          status: isPaid ? 'paid' : 'pending',
          updated_at: new Date().toISOString() 
        })
        .eq("paypal_order_id", paypalOrderId);

      if (error) {
        console.error("Error updating PayPal order:", error);
      }

      return new Response(JSON.stringify({ 
        status: orderData.status,
        paid: isPaid
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

    throw new Error("Missing session ID or PayPal order ID");

  } catch (error) {
    console.error("Error in verify-payment:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});