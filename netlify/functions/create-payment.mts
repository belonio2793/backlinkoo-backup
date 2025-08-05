import type { Context, Config } from "@netlify/functions";
import Stripe from "stripe";

interface PaymentRequest {
  amount: number;
  productName: string;
  isGuest?: boolean;
  guestEmail?: string;
  paymentMethod: 'stripe';
  credits?: number;
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

async function getClientIP(request: Request): Promise<string> {
  const forwarded = request.headers.get('x-forwarded-for');
  const realIP = request.headers.get('x-real-ip');
  const cfConnectingIP = request.headers.get('cf-connecting-ip');
  
  return forwarded?.split(',')[0]?.trim() || realIP || cfConnectingIP || 'unknown';
}

async function createStripePayment(
  paymentData: PaymentRequest,
  email: string,
  originUrl: string
): Promise<{ url: string; sessionId: string }> {
  const stripeSecretKey = process.env.STRIPE_SECRET_KEY;

  if (!stripeSecretKey) {
    throw new Error("STRIPE_SECRET_KEY is not configured in Netlify environment variables");
  }

  const stripe = new Stripe(stripeSecretKey, {
    apiVersion: "2023-10-16",
  });

  let customerId;
  if (!paymentData.isGuest) {
    const customers = await stripe.customers.list({ email, limit: 1 });
    if (customers.data.length > 0) {
      customerId = customers.data[0].id;
    }
  }

  // Create checkout session with dynamic product
  const session = await stripe.checkout.sessions.create({
    customer: customerId,
    customer_email: customerId ? undefined : email,
    line_items: [
      {
        price_data: {
          currency: "usd",
          product_data: { 
            name: paymentData.productName,
            metadata: {
              credits: paymentData.credits?.toString() || '0',
              type: 'credits'
            }
          },
          unit_amount: Math.round(paymentData.amount * 100), // Convert to cents
        },
        quantity: 1,
      },
    ],
    mode: "payment",
    success_url: `${originUrl}/payment-success?session_id={CHECKOUT_SESSION_ID}&credits=${paymentData.credits || 0}`,
    cancel_url: `${originUrl}/payment-cancelled`,
    metadata: {
      email,
      credits: paymentData.credits?.toString() || '0',
      isGuest: paymentData.isGuest ? 'true' : 'false',
      productName: paymentData.productName
    }
  });

  return { url: session.url!, sessionId: session.id };
}


export default async (req: Request, context: Context) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 200,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "POST, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type, Authorization",
      },
    });
  }

  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { "Content-Type": "application/json" },
    });
  }

  try {
    // Rate limiting check
    const clientIP = await getClientIP(req);
    if (!checkRateLimit(clientIP)) {
      return new Response(
        JSON.stringify({ error: 'Rate limit exceeded. Please try again in a minute.' }),
        { 
          status: 429, 
          headers: { 
            "Content-Type": "application/json",
            "Access-Control-Allow-Origin": "*"
          } 
        }
      );
    }

    const body: PaymentRequest = await req.json();
    
    // Input validation
    if (!body.amount || body.amount <= 0 || body.amount > 100000) {
      throw new Error('Invalid amount. Must be between $0.01 and $100,000');
    }
    
    if (!body.productName || body.productName.length > 200) {
      throw new Error('Invalid product name');
    }

    if (body.paymentMethod !== 'stripe') {
      throw new Error('Only Stripe payments are supported');
    }
    
    const { amount, isGuest = false, paymentMethod } = body;
    const productName = sanitizeInput(body.productName);
    let guestEmail = body.guestEmail ? sanitizeInput(body.guestEmail) : '';
    
    let email = guestEmail;

    // For authenticated users, we should get email from auth header in production
    // For now, we'll use the guest email or require it
    if (!isGuest && !email) {
      throw new Error("Email is required for payment processing");
    }

    if (isGuest && (!guestEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(guestEmail))) {
      throw new Error('Valid email address is required');
    }

    const originUrl = req.headers.get("origin") || "https://backlinkoo.com";
    
    const result = await createStripePayment(body, email, originUrl);

    // TODO: Store order in database for tracking
    console.log(`Payment initiated: ${paymentMethod} - ${email} - $${amount}`);

    return new Response(JSON.stringify(result), {
      headers: { 
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*"
      },
    });

  } catch (error: any) {
    console.error("Payment creation error:", error);
    
    return new Response(
      JSON.stringify({ 
        error: error.message || 'Payment processing failed. Please try again.',
        details: process.env.NODE_ENV === 'development' ? error.stack : undefined
      }), 
      {
        status: 500,
        headers: { 
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*"
        },
      }
    );
  }
};

export const config: Config = {
  path: "/api/create-payment"
};
