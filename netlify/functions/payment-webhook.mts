import type { Context, Config } from "@netlify/functions";
import Stripe from "stripe";
import { createClient } from '@supabase/supabase-js';

interface WebhookEvent {
  type: string;
  data: {
    object: any;
  };
}

// Initialize Supabase client for database operations
function getSupabaseClient() {
  const supabaseUrl = Netlify.env.get("VITE_SUPABASE_URL");
  const supabaseServiceKey = Netlify.env.get("SUPABASE_SERVICE_ROLE_KEY");
  
  if (!supabaseUrl || !supabaseServiceKey) {
    throw new Error("Supabase configuration missing");
  }
  
  return createClient(supabaseUrl, supabaseServiceKey, {
    auth: { persistSession: false }
  });
}

async function handlePaymentSuccess(session: any) {
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
      // Find user by email
      const { data: userData, error: userError } = await supabase.auth.admin.listUsers();
      
      if (!userError && userData?.users) {
        const user = userData.users.find(u => u.email === email);
        
        if (user) {
          // Update user credits
          const { error: creditsError } = await supabase
            .from('user_credits')
            .upsert({
              user_id: user.id,
              credits: credits,
              updated_at: new Date().toISOString()
            }, {
              onConflict: 'user_id',
              ignoreDuplicates: false
            });

          if (creditsError) {
            console.error('Credits update error:', creditsError);
          } else {
            console.log(`Added ${credits} credits to user ${email}`);
          }
        }
      }
    }

    console.log('Payment processing completed successfully');
    
  } catch (error) {
    console.error('Payment processing error:', error);
    throw error;
  }
}

async function handleSubscriptionSuccess(subscription: any) {
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
        subscription_plan: plan,
        payment_method: 'stripe',
        guest_checkout: isGuest,
        current_period_start: new Date(subscription.current_period_start * 1000).toISOString(),
        current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
        status: subscription.status,
        updated_at: new Date().toISOString()
      }, {
        onConflict: 'email',
        ignoreDuplicates: false
      });

    if (subscriptionError) {
      console.error('Subscription recording error:', subscriptionError);
    }

    // Update user premium status if not guest
    if (!isGuest) {
      const { data: userData, error: userError } = await supabase.auth.admin.listUsers();
      
      if (!userError && userData?.users) {
        const user = userData.users.find(u => u.email === email);
        
        if (user) {
          // Update user metadata to mark as premium
          const { error: userUpdateError } = await supabase.auth.admin.updateUserById(
            user.id,
            {
              user_metadata: {
                ...user.user_metadata,
                subscription_tier: 'premium',
                subscription_plan: plan,
                subscribed: true
              }
            }
          );

          if (userUpdateError) {
            console.error('User metadata update error:', userUpdateError);
          } else {
            console.log(`Updated premium status for user ${email}`);
          }
        }
      }
    }

    console.log('Subscription processing completed successfully');
    
  } catch (error) {
    console.error('Subscription processing error:', error);
    throw error;
  }
}

async function handleSubscriptionCancellation(subscription: any) {
  console.log('Processing subscription cancellation:', subscription.id);
  
  const supabase = getSupabaseClient();
  
  try {
    // Update subscription status in database
    const { error: updateError } = await supabase
      .from('subscribers')
      .update({
        status: 'canceled',
        canceled_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('stripe_subscription_id', subscription.id);

    if (updateError) {
      console.error('Subscription cancellation update error:', updateError);
    }

    // Update user premium status
    const { data: subscriberData, error: subscriberError } = await supabase
      .from('subscribers')
      .select('email')
      .eq('stripe_subscription_id', subscription.id)
      .single();

    if (!subscriberError && subscriberData?.email) {
      const { data: userData, error: userError } = await supabase.auth.admin.listUsers();
      
      if (!userError && userData?.users) {
        const user = userData.users.find(u => u.email === subscriberData.email);
        
        if (user) {
          const { error: userUpdateError } = await supabase.auth.admin.updateUserById(
            user.id,
            {
              user_metadata: {
                ...user.user_metadata,
                subscribed: false,
                subscription_canceled_at: new Date().toISOString()
              }
            }
          );

          if (userUpdateError) {
            console.error('User cancellation update error:', userUpdateError);
          }
        }
      }
    }

    console.log('Subscription cancellation processed successfully');
    
  } catch (error) {
    console.error('Subscription cancellation processing error:', error);
    throw error;
  }
}

export default async (req: Request, context: Context) => {
  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { "Content-Type": "application/json" },
    });
  }

  try {
    const stripe = new Stripe(Netlify.env.get("STRIPE_SECRET_KEY") || "", {
      apiVersion: "2023-10-16",
    });

    const body = await req.text();
    const signature = req.headers.get('stripe-signature');
    const webhookSecret = Netlify.env.get("STRIPE_WEBHOOK_SECRET");

    if (!signature) {
      return new Response(JSON.stringify({ error: "No signature provided" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    let event: Stripe.Event;

    // Verify webhook signature if webhook secret is configured
    if (webhookSecret) {
      try {
        event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
      } catch (err: any) {
        console.error('Webhook signature verification failed:', err.message);
        return new Response(JSON.stringify({ error: "Invalid signature" }), {
          status: 400,
          headers: { "Content-Type": "application/json" },
        });
      }
    } else {
      // If no webhook secret, parse the body directly (less secure, for development)
      event = JSON.parse(body);
    }

    console.log('Processing webhook event:', event.type);

    // Handle different event types
    switch (event.type) {
      case 'checkout.session.completed':
        const session = event.data.object as Stripe.Checkout.Session;
        
        if (session.mode === 'payment') {
          // One-time payment (credits)
          await handlePaymentSuccess(session);
        } else if (session.mode === 'subscription') {
          // Subscription setup completed
          console.log('Subscription setup completed, waiting for first payment...');
        }
        break;

      case 'invoice.payment_succeeded':
        const invoice = event.data.object as Stripe.Invoice;
        
        if (invoice.subscription) {
          // Get the subscription details
          const subscription = await stripe.subscriptions.retrieve(invoice.subscription as string);
          await handleSubscriptionSuccess(subscription);
        }
        break;

      case 'customer.subscription.deleted':
        const canceledSubscription = event.data.object as Stripe.Subscription;
        await handleSubscriptionCancellation(canceledSubscription);
        break;

      case 'invoice.payment_failed':
        console.log('Payment failed for invoice:', event.data.object);
        // TODO: Handle failed payments (send notification, update status, etc.)
        break;

      default:
        console.log('Unhandled event type:', event.type);
    }

    return new Response(JSON.stringify({ received: true }), {
      headers: { "Content-Type": "application/json" },
    });

  } catch (error: any) {
    console.error("Webhook processing error:", error);
    
    return new Response(
      JSON.stringify({ 
        error: 'Webhook processing failed',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      }), 
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
};

export const config: Config = {
  path: "/api/webhook/stripe"
};
