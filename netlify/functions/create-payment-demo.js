// Demo payment function for development when Stripe keys aren't configured
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
    const originUrl = event.headers.origin || event.headers.referer || "http://localhost:8888";
    
    console.log("Demo payment request:", {
      amount: body.amount,
      productName: body.productName,
      paymentMethod: body.paymentMethod
    });

    // Return demo response for development
    return {
      statusCode: 200,
      headers: { 
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*"
      },
      body: JSON.stringify({
        url: `${originUrl}/payment-success?session_id=demo_session_123&credits=${body.credits || 0}`,
        sessionId: "demo_session_123",
        demo: true,
        message: "Demo mode - no real payment processed"
      }),
    };

  } catch (error) {
    console.error("Demo payment error:", error);

    return {
      statusCode: 500,
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*"
      },
      body: JSON.stringify({
        error: "Demo payment failed",
        details: error.message
      }),
    };
  }
};
