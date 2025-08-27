const Stripe = require("stripe");

exports.handler = async (event, context) => {
  // Handle CORS preflight
  if (event.httpMethod === "OPTIONS") {
    return {
      statusCode: 200,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type",
      },
    };
  }

  if (event.httpMethod !== "GET") {
    return {
      statusCode: 405,
      headers: { 
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*"
      },
      body: JSON.stringify({ error: "Method not allowed" }),
    };
  }

  try {
    const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
    const stripePublishableKey = process.env.VITE_STRIPE_PUBLISHABLE_KEY;
    const stripeWebhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

    console.log("Environment variable check:");
    console.log("STRIPE_SECRET_KEY exists:", !!stripeSecretKey);
    console.log("STRIPE_SECRET_KEY starts with sk_:", stripeSecretKey?.startsWith('sk_'));
    console.log("STRIPE_SECRET_KEY length:", stripeSecretKey?.length);
    console.log("STRIPE_SECRET_KEY first 20 chars:", stripeSecretKey?.substring(0, 20));
    console.log("STRIPE_SECRET_KEY last 10 chars:", stripeSecretKey?.substring(stripeSecretKey.length - 10));
    
    console.log("VITE_STRIPE_PUBLISHABLE_KEY exists:", !!stripePublishableKey);
    console.log("VITE_STRIPE_PUBLISHABLE_KEY starts with pk_:", stripePublishableKey?.startsWith('pk_'));
    
    console.log("STRIPE_WEBHOOK_SECRET exists:", !!stripeWebhookSecret);
    console.log("STRIPE_WEBHOOK_SECRET starts with whsec_:", stripeWebhookSecret?.startsWith('whsec_'));

    // Validate Stripe configuration
    if (!stripeSecretKey || !stripeSecretKey.startsWith('sk_')) {
      throw new Error("STRIPE_SECRET_KEY is missing or invalid");
    }

    if (!stripePublishableKey || !stripePublishableKey.startsWith('pk_')) {
      throw new Error("VITE_STRIPE_PUBLISHABLE_KEY is missing or invalid");
    }

    const stripe = new Stripe(stripeSecretKey, {
      apiVersion: "2023-10-16",
    });

    // Test the connection by retrieving account info
    const account = await stripe.accounts.retrieve();
    
    return {
      statusCode: 200,
      headers: { 
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*"
      },
      body: JSON.stringify({
        success: true,
        message: "Stripe configuration is valid",
        account: {
          id: account.id,
          country: account.country,
          default_currency: account.default_currency,
          charges_enabled: account.charges_enabled,
          payouts_enabled: account.payouts_enabled
        },
        keys: {
          secret_key_valid: true,
          publishable_key_valid: true,
          webhook_secret_exists: !!stripeWebhookSecret
        }
      }),
    };

  } catch (error) {
    console.error("Stripe configuration test error:", error);

    return {
      statusCode: 500,
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*"
      },
      body: JSON.stringify({
        success: false,
        error: error.message,
        details: process.env.NODE_ENV === 'development' ? error.stack : undefined
      }),
    };
  }
};
