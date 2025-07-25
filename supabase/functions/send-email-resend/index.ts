import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY')

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { to, subject, html, message, from, fromName } = await req.json()

    if (!RESEND_API_KEY) {
      throw new Error('RESEND_API_KEY not configured in Supabase environment variables')
    }

    if (!to || !subject) {
      throw new Error('Missing required fields: to, subject')
    }

    // Create HTML content
    const emailHtml = html || `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: linear-gradient(135deg, #3B82F6, #8B5CF6); padding: 20px; text-align: center;">
          <h1 style="color: white; margin: 0; font-size: 24px;">🔗 Backlink ∞</h1>
        </div>
        <div style="padding: 30px; background: #ffffff;">
          <h2 style="color: #333; margin-top: 0;">${subject}</h2>
          <div style="white-space: pre-wrap; line-height: 1.6; color: #555;">
            ${message || 'No message content provided.'}
          </div>
        </div>
        <div style="background: #f8f9fa; padding: 20px; text-align: center; border-top: 1px solid #eee;">
          <p style="margin: 0; font-size: 12px; color: #666;">
            Sent via Backlink ∞ Email System (Supabase + Resend)<br>
            ${new Date().toISOString()}
          </p>
          <div style="margin-top: 10px;">
            <a href="https://backlinkoo.com" style="color: #3B82F6; text-decoration: none; font-size: 12px;">
              🌐 Visit Backlink ∞
            </a>
          </div>
        </div>
      </div>
    `

    const emailData = {
      from: from || `${fromName || 'Backlink ∞'} <noreply@backlinkoo.com>`,
      to: [to],
      subject: subject,
      html: emailHtml,
      headers: {
        'X-Entity-Ref-ID': crypto.randomUUID(),
        'X-Delivery-Provider': 'supabase-resend'
      }
    }

    console.log('Sending email via Resend:', { to, subject, from: emailData.from })

    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(emailData),
    })

    if (!response.ok) {
      const errorData = await response.text()
      console.error('Resend API error:', response.status, errorData)
      throw new Error(`Resend API error (${response.status}): ${errorData}`)
    }

    const result = await response.json()
    console.log('Email sent successfully:', result)

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Email sent successfully via Supabase + Resend',
        emailId: result.id,
        provider: 'supabase_resend',
        timestamp: new Date().toISOString()
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      },
    )
  } catch (error) {
    console.error('Email sending error:', error)
    
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message,
        provider: 'supabase_resend',
        timestamp: new Date().toISOString()
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      },
    )
  }
})
