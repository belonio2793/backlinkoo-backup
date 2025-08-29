const Stripe = require("stripe");
const { createClient } = require('@supabase/supabase-js');
const Stripe = require('stripe');

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

exports.handler = async (event, context) => {
  // CORS headers
  const headers = {
    "Content-Type": "application/json",
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "Content-Type",
    "Access-Control-Allow-Methods": "GET, OPTIONS"
  };

  // Handle preflight request
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
  }

  if (event.httpMethod !== 'GET') {
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ error: 'Method not allowed' })
    };
  }

  try {
    const sessionId = event.queryStringParameters?.session_id;
    
    if (!sessionId) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ 
          verified: false,
          error: 'Session ID is required' 
        })
      };
    }

    const stripeSecretKey = process.env.STRIPE_SECRET_KEY;

    if (!stripeSecretKey || !stripeSecretKey.startsWith('sk_')) {
      return {
        statusCode: 500,
        headers,
        body: JSON.stringify({
          verified: false,
          error: 'Valid Stripe secret key is required for live payments'
        })
      };
    }

    const stripe = new Stripe(stripeSecretKey, {
      apiVersion: "2023-10-16",
    });

    // Retrieve the session from Stripe
    const session = await stripe.checkout.sessions.retrieve(sessionId);
    
    if (!session) {
      return {
        statusCode: 404,
        headers,
        body: JSON.stringify({ 
          verified: false,
          error: 'Payment session not found' 
        })
      };
    }

    // Check if payment was successful
    const isPaymentSuccessful = session.payment_status === 'paid' || session.status === 'complete';

    if (!isPaymentSuccessful) {
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({
          verified: false,
          error: `Payment not completed. Status: ${session.payment_status || session.status}`
        })
      };
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

    // Update order status to completed
    try {
      await supabase.from('orders')
        .update({ status: 'completed', updated_at: new Date().toISOString() })
        .eq('stripe_session_id', sessionId);
    } catch (_) {}

    // Allocate credits if applicable (idempotent)
    let allocatedCredits = 0;
    let userId = order?.user_id || null;
    const customerEmail = (metadata.email || session.customer_details?.email || order?.email || '').toLowerCase();

    // Resolve userId via profiles if missing
    if (!userId && customerEmail) {
      const { data: profile } = await supabase
        .from('profiles')
        .select('user_id')
        .eq('email', customerEmail)
        .single();
      userId = profile?.user_id || null;
    }

    if (credits > 0 && userId) {
      // Check if already processed for this order
      let alreadyProcessed = false;
      if (order?.id) {
        const { data: existingTx } = await supabase
          .from('credit_transactions')
          .select('id')
          .eq('order_id', order.id)
          .limit(1)
          .maybeSingle();
        alreadyProcessed = !!existingTx;
      }

      if (!alreadyProcessed) {
        // Fetch current credits
        const { data: currentCredits } = await supabase
          .from('credits')
          .select('amount, total_purchased')
          .eq('user_id', userId)
          .single();

        const newAmount = (currentCredits?.amount || 0) + credits;
        const newPurchased = (currentCredits?.total_purchased || 0) + credits;

        if (currentCredits) {
          await supabase
            .from('credits')
            .update({ amount: newAmount, total_purchased: newPurchased, updated_at: new Date().toISOString() })
            .eq('user_id', userId);
        } else {
          await supabase
            .from('credits')
            .insert({ user_id: userId, amount: credits, total_purchased: credits, total_used: 0, created_at: new Date().toISOString(), updated_at: new Date().toISOString() });
        }

        // Record transaction
        await supabase
          .from('credit_transactions')
          .insert({
            user_id: userId,
            amount: credits,
            type: 'purchase',
            order_id: order?.id || null,
            description: metadata.product_name || 'Credits purchase',
            created_at: new Date().toISOString()
          });

        allocatedCredits = credits;
      }
    }

    // Return verification result
    const result = {
      verified: true,
      sessionId: session.id,
      amount: session.amount_total ? session.amount_total / 100 : 0, // Convert from cents
      currency: session.currency,
      customerEmail: customerEmail || undefined,
      orderId: order?.id,
      ...(allocatedCredits > 0 && { credits: allocatedCredits }),
      ...(plan && { plan })
    };

    console.log(`✅ Payment verified: ${sessionId} - ${result.customerEmail} - $${result.amount}${allocatedCredits ? ` (+${allocatedCredits} credits)` : ''}`);

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify(result)
    };

  } catch (error) {
    console.error("Payment verification error:", error);
    
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ 
        verified: false,
        error: error.message || 'Payment verification failed',
        details: process.env.NODE_ENV === 'development' ? error.stack : undefined
      })
    };
  }
};
