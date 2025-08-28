const Stripe = require("stripe");

exports.handler = async (event, context) => {
  // Handle CORS preflight
  if (event.httpMethod === "OPTIONS") {
    return {
      statusCode: 200,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "POST, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type, Authorization",
      },
    };
  }

  if (event.httpMethod !== "POST") {
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
    const body = JSON.parse(event.body);
    
    // Input validation
    if (!body.amount || body.amount <= 0 || body.amount > 10000) {
      throw new Error('Invalid amount. Must be between $0.01 and $10,000');
    }
    
    if (!body.productName || body.productName.length > 200) {
      throw new Error('Invalid product name');
    }

    if (body.paymentMethod !== 'stripe') {
      throw new Error('Only Stripe payments are supported');
    }

    const stripeSecretKey = process.env.STRIPE_SECRET_KEY;

    // Validate Stripe configuration
    if (!stripeSecretKey || !stripeSecretKey.startsWith('sk_')) {
      throw new Error("STRIPE_SECRET_KEY is required and must be a valid Stripe secret key");
    }

    const stripe = new Stripe(stripeSecretKey, {
      apiVersion: "2023-10-16",
    });
    
    const { amount, isGuest = false } = body;
    const productName = body.productName.replace(/[<>'"&]/g, '').trim();
    let guestEmail = body.guestEmail ? body.guestEmail.replace(/[<>'"&]/g, '').trim() : '';
    
    let email = guestEmail;

    if (isGuest && (!guestEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(guestEmail))) {
      throw new Error('Valid email address is required');
    }

    const originUrl = event.headers.origin || event.headers.referer || "https://backlinkoo.com";
    
    // Use live Stripe product ID for credits - backlinkoo.com production
    const CREDITS_PRODUCT_ID = "prod_SoVoAb8dXp1cS0";

    // Create checkout session with live product ID
    const session = await stripe.checkout.sessions.create({
      customer_email: email,
      line_items: [
        {
          price_data: {
            currency: "usd",
            product: CREDITS_PRODUCT_ID,
            unit_amount: Math.round(amount * 100), // Convert to cents
          },
          quantity: 1,
        },
      ],
      mode: "payment",
      success_url: `${originUrl}/payment-success?session_id={CHECKOUT_SESSION_ID}&credits=${body.credits || 0}`,
      cancel_url: `${originUrl}/payment-cancelled`,
      metadata: {
        email,
        credits: body.credits?.toString() || '0',
        product_type: "credits",
        is_guest: isGuest ? 'true' : 'false',
        guest_email: isGuest ? email : "",
        product_name: productName,
        product_id: CREDITS_PRODUCT_ID
      }
    });

    console.log(`Payment initiated: stripe - ${email} - $${amount}`);

    return {
      statusCode: 200,
      headers: { 
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*"
      },
      body: JSON.stringify({ url: session.url, sessionId: session.id }),
    };

  } catch (error) {
    console.error("Payment creation error:", error);

    // Provide user-friendly error messages
    let userMessage = error.message || 'Payment processing failed. Please try again.';

    return {
      statusCode: 500,
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*"
      },
      body: JSON.stringify({
        error: userMessage,
        details: process.env.NODE_ENV === 'development' ? error.stack : undefined
      }),
    };
  }
};
