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
    const { to, subject, message, from } = JSON.parse(event.body);

    // Validate required fields
    if (!to || !subject || !message) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ 
          error: 'Missing required fields: to, subject, message' 
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
