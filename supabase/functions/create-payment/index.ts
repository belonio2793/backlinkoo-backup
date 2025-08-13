import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@14.21.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface PaymentRequest {
  amount: number;
  productName: string;
  isGuest?: boolean;
  guestEmail?: string;
  paymentMethod: 'stripe' | 'paypal';
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

    const body: PaymentRequest = await req.json();
    
    // Input validation
    if (!body.amount || body.amount <= 0 || body.amount > 1000000) {
      throw new Error('Invalid amount');
    }
    
    if (!body.productName || body.productName.length > 200) {
      throw new Error('Invalid product name');
    }
    
    const { amount, isGuest = false, paymentMethod } = body;
    const productName = sanitizeInput(body.productName);
    let guestEmail = body.guestEmail ? sanitizeInput(body.guestEmail) : '';
    
    let user = null;
    let email = guestEmail;

    if (!isGuest) {
      const authHeader = req.headers.get("Authorization");
      if (authHeader) {
        try {
          const token = authHeader.replace("Bearer ", "");
          const { data: userData, error: userError } = await supabaseClient.auth.getUser(token);
          if (!userError && userData.user?.email) {
            user = userData.user;
            email = userData.user.email;
          } else {
            console.warn("Auth failed, treating as guest:", userError?.message);
            isGuest = true;
          }
        } catch (authError) {
          console.warn("Auth error, treating as guest:", authError);
          isGuest = true;
        }
      } else {
        console.warn("No auth header, treating as guest");
        isGuest = true;
      }
    }

    if (isGuest) {
      if (!guestEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(guestEmail)) {
        throw new Error('Valid guest email is required for guest checkout');
      }
      email = guestEmail;
    }

    if (!email) {
      throw new Error("Email is required for payment processing");
    }

    if (paymentMethod === 'stripe') {
      const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
      console.log("Stripe key available:", !!stripeKey, "Length:", stripeKey?.length || 0);

      if (!stripeKey || stripeKey.length < 10) {
        throw new Error("Stripe secret key not configured. Please set STRIPE_SECRET_KEY environment variable.");
      }

      const stripe = new Stripe(stripeKey, {
        apiVersion: "2023-10-16",
      });

      let customerId;
      if (!isGuest) {
        const customers = await stripe.customers.list({ email, limit: 1 });
        if (customers.data.length > 0) {
          customerId = customers.data[0].id;
        }
      }

      const session = await stripe.checkout.sessions.create({
        customer: customerId,
        customer_email: customerId ? undefined : email,
        line_items: [
          {
            price_data: {
              currency: "usd",
              product_data: { name: productName },
              unit_amount: amount * 100, // Convert to cents
            },
            quantity: 1,
          },
        ],
        mode: "payment",
        success_url: `${req.headers.get("origin")}/payment-success?session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${req.headers.get("origin")}/payment-cancelled`,
      });

      // Record order in database
      await supabaseClient.from("orders").insert({
        user_id: user?.id || null,
        email,
        stripe_session_id: session.id,
        amount: amount * 100,
        status: "pending",
        payment_method: "stripe",
        product_name: productName,
        guest_checkout: isGuest,
      });

      return new Response(JSON.stringify({ url: session.url, sessionId: session.id }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    } else if (paymentMethod === 'paypal') {
      // PayPal integration
      const paypalClientId = Deno.env.get("PAYPAL_CLIENT_ID");
      const paypalSecret = Deno.env.get("PAYPAL_SECRET_KEY");
      
      if (!paypalClientId || !paypalSecret) {
        throw new Error("PayPal credentials not configured");
      }

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

      // Create PayPal order
      const orderResponse = await fetch("https://api.paypal.com/v2/checkout/orders", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${authData.access_token}`,
        },
        body: JSON.stringify({
          intent: "CAPTURE",
          purchase_units: [{
            amount: {
              currency_code: "USD",
              value: amount.toString(),
            },
            description: productName,
          }],
          application_context: {
            return_url: `${req.headers.get("origin")}/payment-success`,
            cancel_url: `${req.headers.get("origin")}/payment-cancelled`,
          },
        }),
      });

      const orderData = await orderResponse.json();
      const approvalUrl = orderData.links.find((link: any) => link.rel === "approve")?.href;

      // Record order in database
      await supabaseClient.from("orders").insert({
        user_id: user?.id || null,
        email,
        paypal_order_id: orderData.id,
        amount: amount * 100,
        status: "pending",
        payment_method: "paypal",
        product_name: productName,
        guest_checkout: isGuest,
      });

      return new Response(JSON.stringify({ url: approvalUrl, orderId: orderData.id }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

    throw new Error("Invalid payment method");

  } catch (error) {
    console.error("Error in create-payment:", error);
    console.error("Error details:", {
      name: error.name,
      message: error.message,
      stack: error.stack,
      cause: error.cause
    });

    // Provide more specific error messages
    let errorMessage = error.message;
    if (error.message?.includes("STRIPE_SECRET_KEY")) {
      errorMessage = "Payment system configuration error. Please contact support.";
    } else if (error.message?.includes("rate limit")) {
      errorMessage = "Too many requests. Please wait a moment and try again.";
    } else if (error.message?.includes("network") || error.message?.includes("fetch")) {
      errorMessage = "Network error. Please check your connection and try again.";
    }

    return new Response(JSON.stringify({
      error: errorMessage,
      code: error.code || 'PAYMENT_ERROR',
      timestamp: new Date().toISOString()
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
