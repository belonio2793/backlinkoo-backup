const Stripe = require("stripe");
const { createClient } = require('@supabase/supabase-js');

// Initialize Supabase client for database operations
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

async function handlePaymentSuccess(session) {
  console.log('Processing successful payment:', session.id);
  
  const supabase = getSupabaseClient();
  const metadata = session.metadata || {};
  
  try {
    // Extract payment information
    const email = metadata.email || session.customer_email;
    const credits = parseInt(metadata.credits || '0');
    const isGuest = metadata.isGuest === 'true';
    const amount = session.amount_total / 100; // Convert from cents
    
    // Record the order in database
    const { error: orderError } = await supabase
      .from('orders')
      .insert({
        stripe_session_id: session.id,
        email,
        amount: session.amount_total,
        status: 'completed',
        payment_method: 'stripe',
        product_name: metadata.productName || `${credits} Backlink Credits`,
        guest_checkout: isGuest,
        credits: credits,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      });

    if (orderError) {
      console.error('Order recording error:', orderError);
    }

    // If credits were purchased, update user balance
    if (credits > 0 && !isGuest) {
      console.log(`Processing credit purchase: ${credits} credits for ${email}`);
      
      // Find user by email
      const { data: userData, error: userError } = await supabase.auth.admin.listUsers();
      
      if (userError) {
        console.error('Error fetching users:', userError);
        throw new Error(`Failed to find user: ${userError.message}`);
      }
      
      if (!userData?.users) {
        console.error('No users data returned from auth admin');
        throw new Error('Failed to fetch user data');
      }
      
      const user = userData.users.find(u => u.email === email);
      
      if (!user) {
        console.error(`User not found with email: ${email}`);
        throw new Error(`User not found: ${email}`);
      }
      
      console.log(`Found user: ${user.id} (${email})`);
      
      if (user) {
        // Get current credits first
        const { data: currentCredits, error: fetchError } = await supabase
          .from('user_credits')
          .select('credits')
          .eq('user_id', user.id)
          .single();

        const existingCredits = (currentCredits?.credits || 0);
        const newTotalCredits = existingCredits + credits;

        // Update user credits
        const { error: creditsError } = await supabase
          .from('user_credits')
          .upsert({
            user_id: user.id,
            credits: newTotalCredits,
            updated_at: new Date().toISOString()
          }, {
            onConflict: 'user_id',
            ignoreDuplicates: false
          });

        if (creditsError) {
          console.error('Credits update error:', creditsError);
          throw new Error(`Failed to update credits: ${creditsError.message}`);
        } else {
          console.log(`✅ Successfully added ${credits} credits to user ${email} (total: ${newTotalCredits})`);
        }
      } else {
        console.error(`❌ User not found with email: ${email}`);
        throw new Error(`User not found: ${email}`);
      }
    }

    console.log('Payment processing completed successfully');
    
  } catch (error) {
    console.error('Payment processing error:', error);
    throw error;
  }
}

async function handleSubscriptionSuccess(subscription) {
  console.log('Processing successful subscription:', subscription.id);
  
  const supabase = getSupabaseClient();
  const metadata = subscription.metadata || {};
  
  try {
    const email = metadata.email;
    const plan = metadata.plan;
    const isGuest = metadata.isGuest === 'true';
    
    if (!email) {
      throw new Error('Email not found in subscription metadata');
    }

    // Record/update subscription in database
    const { error: subscriptionError } = await supabase
      .from('subscribers')
      .upsert({
        email,
        stripe_customer_id: subscription.customer,
        stripe_subscription_id: subscription.id,
        subscribed: true,
        subscription_tier: 'premium',
        subscription_status: subscription.status,
        plan_type: plan,
        guest_subscription: isGuest,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }, {
        onConflict: 'email',
        ignoreDuplicates: false
      });

    if (subscriptionError) {
      console.error('Subscription recording error:', subscriptionError);
      throw new Error(`Failed to record subscription: ${subscriptionError.message}`);
    }

    console.log(`✅ Successfully recorded subscription for ${email} (${plan})`);
    
  } catch (error) {
    console.error('Subscription processing error:', error);
    throw error;
  }
}

exports.handler = async (event, context) => {
  // CORS headers
  const headers = {
    "Content-Type": "application/json",
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "Content-Type, Stripe-Signature",
    "Access-Control-Allow-Methods": "POST, OPTIONS"
  };

  // Handle preflight request
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
  }

  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ error: 'Method not allowed' })
    };
  }

  const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!stripeSecretKey) {
    console.error('Stripe secret key not configured');
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: 'Payment system not configured' })
    };
  }

  const stripe = new Stripe(stripeSecretKey, {
    apiVersion: "2023-10-16",
  });

  try {
    let webhookEvent;

    if (webhookSecret) {
      // Verify webhook signature
      const signature = event.headers['stripe-signature'];
      try {
        webhookEvent = stripe.webhooks.constructEvent(event.body, signature, webhookSecret);
      } catch (err) {
        console.error('Webhook signature verification failed:', err.message);
        return {
          statusCode: 400,
          headers,
          body: JSON.stringify({ error: 'Webhook signature verification failed' })
        };
      }
    } else {
      // No webhook secret configured, parse event directly (less secure)
      console.warn('No webhook secret configured - using less secure direct parsing');
      webhookEvent = JSON.parse(event.body);
    }

    console.log('Processing webhook event:', webhookEvent.type);

    // Handle the event
    switch (webhookEvent.type) {
      case 'checkout.session.completed':
        const session = webhookEvent.data.object;
        
        if (session.mode === 'payment') {
          // One-time payment (credits)
          await handlePaymentSuccess(session);
        } else if (session.mode === 'subscription') {
          // Subscription payment
          const subscription = await stripe.subscriptions.retrieve(session.subscription);
          await handleSubscriptionSuccess(subscription);
        }
        break;

      case 'invoice.payment_succeeded':
        const invoice = webhookEvent.data.object;
        if (invoice.subscription) {
          const subscription = await stripe.subscriptions.retrieve(invoice.subscription);
          await handleSubscriptionSuccess(subscription);
        }
        break;

      case 'customer.subscription.deleted':
        // Handle subscription cancellation
        const cancelledSubscription = webhookEvent.data.object;
        console.log('Subscription cancelled:', cancelledSubscription.id);
        
        const supabase = getSupabaseClient();
        const { error: cancelError } = await supabase
          .from('subscribers')
          .update({
            subscribed: false,
            subscription_status: 'cancelled',
            updated_at: new Date().toISOString()
          })
          .eq('stripe_subscription_id', cancelledSubscription.id);

        if (cancelError) {
          console.error('Error updating cancelled subscription:', cancelError);
        }
        break;

      default:
        console.log(`Unhandled event type: ${webhookEvent.type}`);
    }

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ received: true })
    };

  } catch (error) {
    console.error('Webhook processing error:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ 
        error: 'Webhook processing failed',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      })
    };
  }
};
