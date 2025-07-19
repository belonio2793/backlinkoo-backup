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
    const { amount, productName, isGuest = false, guestEmail, paymentMethod }: PaymentRequest = await req.json();
    
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
      throw new Error("Email is required for payment processing");
    }

    if (paymentMethod === 'stripe') {
      const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") || "", {
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
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});