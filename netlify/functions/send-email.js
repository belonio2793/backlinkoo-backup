const { Resend } = require('resend');

exports.handler = async (event, context) => {
  // CORS headers
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
  };

  // Handle preflight requests
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers,
      body: '',
    };
  }

  // Only allow POST requests
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ error: 'Method not allowed' }),
    };
  }

  try {
    let requestBody;

    try {
      requestBody = JSON.parse(event.body || '{}');
    } catch (parseError) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({
          error: 'Invalid JSON in request body',
          details: parseError.message
        }),
      };
    }

    const { to, subject, message, from, test = false } = requestBody;

    // Handle test requests
    if (test === true) {
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({
          success: true,
          message: 'Netlify email function is available',
          provider: 'netlify_resend',
          hasResendKey: !!process.env.RESEND_API_KEY,
          timestamp: new Date().toISOString(),
          testMode: true
        }),
      };
    }

    // Validate required fields
    if (!to || !subject || !message) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({
          error: 'Missing required fields: to, subject, message',
          received: { to: !!to, subject: !!subject, message: !!message }
        }),
      };
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(to)) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({
          error: 'Invalid email address format',
          email: to
        }),
      };
    }

    // Initialize Resend with API key from environment
    const resend = new Resend(process.env.RESEND_API_KEY);

    if (!process.env.RESEND_API_KEY) {
      throw new Error('RESEND_API_KEY not configured in environment variables');
    }

    // Send email via Resend
    const emailData = {
      from: from || 'Backlink ∞ Support <support@backlinkoo.com>',
      to: [to],
      subject: subject,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background: linear-gradient(135deg, #3B82F6, #8B5CF6); padding: 20px; text-align: center;">
            <h1 style="color: white; margin: 0; font-size: 24px;">Backlink ∞</h1>
          </div>
          <div style="padding: 30px; background: #ffffff;">
            <h2 style="color: #333; margin-top: 0;">${subject}</h2>
            <div style="white-space: pre-wrap; line-height: 1.6; color: #555;">
              ${message}
            </div>
          </div>
          <div style="background: #f8f9fa; padding: 20px; text-align: center; border-top: 1px solid #eee;">
            <p style="margin: 0; font-size: 12px; color: #666;">
              Sent via Backlink ∞ Email System (Netlify + Resend)<br>
              ${new Date().toISOString()}
            </p>
          </div>
        </div>
      `,
    };

    const result = await resend.emails.send(emailData);

    console.log('Email sent successfully via Netlify function:', result);

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        success: true,
        message: 'Email sent successfully via Netlify + Resend',
        emailId: result.data?.id,
        provider: 'netlify_resend'
      }),
    };

  } catch (error) {
    console.error('Netlify email function error:', error);

    // More detailed error information
    const errorDetails = {
      message: error.message || 'Unknown error',
      name: error.name || 'Error',
      stack: error.stack ? error.stack.split('\n').slice(0, 3).join('\n') : undefined,
      hasResendKey: !!process.env.RESEND_API_KEY,
      timestamp: new Date().toISOString()
    };

    console.error('Detailed error information:', errorDetails);

    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        success: false,
        error: error.message || 'Internal server error',
        provider: 'netlify_resend',
        errorCode: error.name || 'UNKNOWN_ERROR',
        timestamp: new Date().toISOString()
      }),
    };
  }
};
