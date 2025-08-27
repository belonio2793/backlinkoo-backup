import type { Context } from "@netlify/functions";
import Stripe from "stripe";
import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client
function getSupabaseClient() {
  const supabaseUrl = process.env.VITE_SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  
  if (!supabaseUrl || !supabaseServiceKey) {
    throw new Error("Supabase configuration missing");
  }
  
  return createClient(supabaseUrl, supabaseServiceKey, {
    auth: { persistSession: false }
  });
}

export default async (req: Request, context: Context) => {
  // CORS headers
  const headers = {
    "Content-Type": "application/json",
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "Content-Type",
    "Access-Control-Allow-Methods": "GET, OPTIONS"
  };

  // Handle preflight request
  if (req.method === 'OPTIONS') {
    return new Response('', { status: 200, headers });
  }

  if (req.method !== 'GET') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers
    });
  }

  try {
    const url = new URL(req.url);
    const sessionId = url.searchParams.get('session_id');
    
    if (!sessionId) {
      return new Response(JSON.stringify({ 
        verified: false,
        error: 'Session ID is required' 
      }), {
        status: 400,
        headers
      });
    }

    const stripeSecretKey = process.env.STRIPE_SECRET_KEY;

    if (!stripeSecretKey || !stripeSecretKey.startsWith('sk_')) {
      return new Response(JSON.stringify({
        verified: false,
        error: 'Valid Stripe secret key is required for live payments'
      }), {
        status: 500,
        headers
      });
    }

    const stripe = new Stripe(stripeSecretKey, {
      apiVersion: "2023-10-16",
    });

    // Retrieve the session from Stripe
    const session = await stripe.checkout.sessions.retrieve(sessionId);
    
    if (!session) {
      return new Response(JSON.stringify({ 
        verified: false,
        error: 'Payment session not found' 
      }), {
        status: 404,
        headers
      });
    }

    // Check if payment was successful
    const isPaymentSuccessful = session.payment_status === 'paid' || session.status === 'complete';
    
    if (!isPaymentSuccessful) {
      return new Response(JSON.stringify({ 
        verified: false,
        error: `Payment not completed. Status: ${session.payment_status || session.status}` 
      }), {
        status: 200,
        headers
      });
    }

    // Verify that the order exists in our database
    const supabase = getSupabaseClient();
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .select('*')
      .eq('stripe_session_id', sessionId)
      .single();

    if (orderError && orderError.code !== 'PGRST116') { // PGRST116 = not found
      console.error('Order lookup error:', orderError);
    }

    // Extract payment details from session
    const metadata = session.metadata || {};
    const credits = parseInt(metadata.credits || '0');
    const plan = metadata.plan;
    
    // Return verification result
    const result = {
      verified: true,
      sessionId: session.id,
      amount: session.amount_total ? session.amount_total / 100 : 0, // Convert from cents
      currency: session.currency,
      customerEmail: metadata.email || session.customer_details?.email,
      orderId: order?.id,
      ...(credits > 0 && { credits }),
      ...(plan && { plan })
    };

    console.log(`✅ Payment verified: ${sessionId} - ${result.customerEmail} - $${result.amount}`);

    return new Response(JSON.stringify(result), {
      status: 200,
      headers
    });

  } catch (error: any) {
    console.error("Payment verification error:", error);
    
    return new Response(JSON.stringify({ 
      verified: false,
      error: error.message || 'Payment verification failed',
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined
    }), {
      status: 500,
      headers
    });
  }
};
