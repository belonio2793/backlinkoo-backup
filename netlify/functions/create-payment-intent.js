const Stripe = require("stripe");

exports.handler = async (event) => {
  const headers = {
    "Content-Type": "application/json",
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
    "Access-Control-Allow-Methods": "POST, OPTIONS"
  };

  if (event.httpMethod === "OPTIONS") {
    return { statusCode: 200, headers, body: "" };
  }

  if (event.httpMethod !== "POST") {
    return { statusCode: 405, headers, body: JSON.stringify({ error: "Method not allowed" }) };
  }

  try {
    const body = JSON.parse(event.body || "{}");
    const credits = Number(body.credits || 0);
    const email = typeof body.email === 'string' ? body.email : undefined;

    if (!Number.isFinite(credits) || credits <= 0 || credits > 50000) {
      return { statusCode: 400, headers, body: JSON.stringify({ error: "Invalid credits" }) };
    }

    const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
    if (!stripeSecretKey || !stripeSecretKey.startsWith("sk_")) {
      return { statusCode: 500, headers, body: JSON.stringify({ error: "Stripe secret key missing" }) };
    }

    const stripe = new Stripe(stripeSecretKey, { apiVersion: "2023-10-16" });

    // Price = $1.40 per credit
    const amountInCents = Math.round(credits * 140);

    const intent = await stripe.paymentIntents.create({
      amount: amountInCents,
      currency: "usd",
      payment_method_types: ["card"],
      metadata: {
        product_type: "credits",
        credits: String(credits),
        email: email || ""
      },
      receipt_email: email || undefined
    });

    return { statusCode: 200, headers, body: JSON.stringify({ clientSecret: intent.client_secret }) };
  } catch (e) {
    const msg = e?.raw?.message || e?.message || 'Failed to create payment intent';
    return { statusCode: 500, headers, body: JSON.stringify({ error: msg }) };
  }
};
