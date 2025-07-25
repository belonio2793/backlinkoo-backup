import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { SMTPClient } from "https://deno.land/x/denomailer@1.6.0/mod.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { to, subject, html, message, from, fromName, smtpConfig } = await req.json()

    if (!to || !subject) {
      throw new Error('Missing required fields: to, subject')
    }

    // Use provided SMTP config or default Resend SMTP settings
    const config = smtpConfig || {
      host: 'smtp.resend.com',
      port: 465,
      secure: true,
      auth: {
        user: 'resend',
        pass: 're_f2ixyRAw_EA1dtQCo9KnANfJgrgqfXFEq'
      }
    }

    console.log('🔧 SMTP Configuration:', {
      host: config.host,
      port: config.port,
      user: config.auth.user,
      secure: config.secure
    })

    // Create SMTP client
    const client = new SMTPClient({
      connection: {
        hostname: config.host,
        port: config.port,
        tls: config.secure,
        auth: {
          username: config.auth.user,
          password: config.auth.pass,
        },
      },
    })

    console.log('📧 Connecting to SMTP server...')

    // Create email content
    const emailHtml = html || `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: linear-gradient(135deg, #3B82F6, #8B5CF6); padding: 20px; text-align: center;">
          <h1 style="color: white; margin: 0; font-size: 24px;">🔗 Backlink ∞</h1>
        </div>
        <div style="padding: 30px; background: #ffffff;">
          <h2 style="color: #333; margin-top: 0;">${subject}</h2>
          <div style="white-space: pre-wrap; line-height: 1.6; color: #555;">
            ${message || 'Email sent via Backlink �� Email System'}
          </div>
        </div>
        <div style="background: #f8f9fa; padding: 20px; text-align: center; border-top: 1px solid #eee;">
          <p style="margin: 0; font-size: 12px; color: #666;">
            Sent via Backlink ∞ Email System (SMTP)<br>
            ${new Date().toISOString()}
          </p>
        </div>
      </div>
    `

    const emailData = {
      from: from || 'noreply@backlinkoo.com',
      to: to,
      subject: subject,
      content: message || 'Email content',
      html: emailHtml,
    }

    console.log('📤 Sending email:', {
      from: emailData.from,
      to: emailData.to,
      subject: emailData.subject
    })

    // Send email via SMTP
    await client.send({
      from: emailData.from,
      to: emailData.to,
      subject: emailData.subject,
      content: emailData.content,
      html: emailData.html,
    })

    console.log('✅ Email sent successfully via SMTP')

    // Close SMTP connection
    await client.close()

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Email sent successfully via Resend SMTP',
        provider: 'resend_smtp',
        timestamp: new Date().toISOString(),
        smtpHost: config.host,
        smtpPort: config.port
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      },
    )
  } catch (error) {
    console.error('❌ SMTP email sending error:', error)
    
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message,
        provider: 'resend_smtp',
        timestamp: new Date().toISOString()
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      },
    )
  }
})
