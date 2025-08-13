const Stripe = require("stripe");
const { createClient } = require('@supabase/supabase-js');

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
    
    if (!stripeSecretKey) {
      return {
        statusCode: 500,
        headers,
        body: JSON.stringify({ 
          verified: false,
          error: 'Stripe configuration missing' 
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
    
    // Return verification result
    const result = {
      verified: true,
      sessionId: session.id,
      amount: session.amount_total / 100, // Convert from cents
      currency: session.currency,
      customerEmail: metadata.email || session.customer_details?.email,
      orderId: order?.id,
      ...(credits > 0 && { credits }),
      ...(plan && { plan })
    };

    console.log(`✅ Payment verified: ${sessionId} - ${result.customerEmail} - $${result.amount}`);

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
