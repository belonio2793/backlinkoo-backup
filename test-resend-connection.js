#!/usr/bin/env node

/**
 * Direct Resend API Test
 * Tests the email configuration without dependencies
 */

const API_KEY = 're_f2ixyRAw_EA1dtQCo9KnANfJgrgqfXFEq'; // From SecureConfig

console.log('🔧 Testing Resend API Configuration\n');

async function testResendAPI() {
  try {
    console.log('1️⃣ Testing API Key validity...');
    
    // Test 1: Check domains
    const domainsResponse = await fetch('https://api.resend.com/domains', {
      headers: {
        'Authorization': `Bearer ${API_KEY}`,
        'Content-Type': 'application/json'
      }
    });
    
    if (domainsResponse.ok) {
      const domains = await domainsResponse.json();
      console.log('✅ Resend API key is valid');
      console.log(`   Domains configured: ${domains.data?.length || 0}`);
      
      if (domains.data?.length > 0) {
        domains.data.forEach(domain => {
          console.log(`   - ${domain.name}: ${domain.status}`);
        });
      }
    } else {
      const errorText = await domainsResponse.text();
      console.log(`❌ API key test failed: ${domainsResponse.status} - ${errorText}`);
      return;
    }

    console.log('\n2️⃣ Testing email sending...');
    
    // Test 2: Send test email
    const testEmailResponse = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        from: 'Backlink ∞ <noreply@backlinkoo.com>',
        to: ['support@backlinkoo.com'],
        subject: '🔧 Email Configuration Test',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <div style="background: linear-gradient(135deg, #3B82F6, #8B5CF6); padding: 20px; text-align: center;">
              <h1 style="color: white; margin: 0; font-size: 24px;">🔗 Backlink ∞</h1>
            </div>
            <div style="padding: 30px; background: #ffffff;">
              <h2 style="color: #333; margin-top: 0;">Email Configuration Test</h2>
              <p style="line-height: 1.6; color: #555;">
                This is a test email to verify that the Resend email service is working correctly 
                for user registration confirmations.
              </p>
              <p style="line-height: 1.6; color: #555;">
                <strong>Test Details:</strong><br>
                - API Key: ${API_KEY.substring(0, 8)}...<br>
                - Timestamp: ${new Date().toISOString()}<br>
                - From: Configuration Test Script
              </p>
            </div>
            <div style="background: #f8f9fa; padding: 20px; text-align: center; border-top: 1px solid #eee;">
              <p style="margin: 0; font-size: 12px; color: #666;">
                Sent via Backlink ∞ Email System Test<br>
                ${new Date().toISOString()}
              </p>
            </div>
          </div>
        `
      })
    });

    if (testEmailResponse.ok) {
      const result = await testEmailResponse.json();
      console.log('✅ Test email sent successfully');
      console.log(`   Email ID: ${result.id}`);
      console.log('   Check your inbox for the test email');
    } else {
      const errorText = await testEmailResponse.text();
      console.log(`❌ Test email failed: ${testEmailResponse.status} - ${errorText}`);
    }

  } catch (error) {
    console.log('❌ Connection error:', error.message);
  }
}

async function checkSupabaseEnvironment() {
  console.log('\n3️⃣ Checking Supabase Environment Configuration...');
  
  // This would normally require Supabase CLI or admin access
  // For now, we'll provide instructions
  console.log('⚠️  Manual step required:');
  console.log('   1. Go to Supabase Dashboard');
  console.log('   2. Navigate to Project Settings > Environment Variables');
  console.log(`   3. Set RESEND_API_KEY = ${API_KEY}`);
  console.log('   4. Restart Edge Functions if needed');
}

async function runTests() {
  await testResendAPI();
  await checkSupabaseEnvironment();
  
  console.log('\n📋 SUMMARY');
  console.log('==========');
  console.log('');
  console.log('If the test email was sent successfully:');
  console.log('✅ Resend API configuration is working');
  console.log('');
  console.log('Next steps for fixing user registration emails:');
  console.log('1. Set RESEND_API_KEY in Supabase project environment variables');
  console.log('2. Configure Supabase Auth email templates');
  console.log('3. Set correct redirect URL: https://backlinkoo.com/auth/confirm');
  console.log('4. Test user registration with a real email address');
  console.log('');
  console.log('If emails still don\'t work:');
  console.log('- Check spam folder');
  console.log('- Verify domain in Resend dashboard');
  console.log('- Check Supabase Auth logs');
  console.log('- Ensure no conflicts between email services');
}

runTests().catch(console.error);
