/**
 * Supabase Email Template Configuration
 * Provides templates and configuration for Supabase Auth emails
 */

export interface EmailTemplateConfig {
  subject: string;
  body: string;
  redirectTo?: string;
}

/**
 * Confirmation email template for Supabase Auth
 */
export const CONFIRMATION_EMAIL_TEMPLATE: EmailTemplateConfig = {
  subject: 'Confirm Your Email - Backlink ∞',
  body: `
<div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif; max-width: 600px; margin: 0 auto; background: #ffffff;">
  <!-- Header -->
  <div style="background: linear-gradient(135deg, #3B82F6 0%, #8B5CF6 100%); padding: 30px 20px; text-align: center;">
    <h1 style="color: white; margin: 0; font-size: 28px; font-weight: 700; letter-spacing: -0.5px;">
      🔗 Backlink ∞
    </h1>
    <p style="color: rgba(255,255,255,0.9); margin: 8px 0 0 0; font-size: 16px;">
      Professional SEO & Backlink Management
    </p>
  </div>

  <!-- Main Content -->
  <div style="padding: 40px 30px; background: #ffffff;">
    <h2 style="color: #1F2937; margin: 0 0 20px 0; font-size: 24px; font-weight: 600;">
      Welcome to Backlink ∞!
    </h2>
    
    <p style="color: #4B5563; line-height: 1.6; margin: 0 0 24px 0; font-size: 16px;">
      Thank you for creating your account. To complete your registration and start building high-authority backlinks, please confirm your email address by clicking the button below.
    </p>

    <!-- CTA Button -->
    <div style="text-align: center; margin: 32px 0;">
      <a href="{{ .ConfirmationURL }}" 
         style="display: inline-block; background: linear-gradient(135deg, #3B82F6 0%, #8B5CF6 100%); color: white; padding: 16px 32px; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 16px; letter-spacing: 0.5px; box-shadow: 0 4px 12px rgba(59, 130, 246, 0.3); transition: all 0.3s ease;">
        ✅ Confirm Email Address
      </a>
    </div>

    <p style="color: #6B7280; line-height: 1.6; margin: 24px 0 0 0; font-size: 14px;">
      If the button above doesn't work, copy and paste this link into your browser:<br>
      <a href="{{ .ConfirmationURL }}" style="color: #3B82F6; word-break: break-all;">{{ .ConfirmationURL }}</a>
    </p>

    <!-- Features Preview -->
    <div style="margin: 32px 0; padding: 24px; background: #F9FAFB; border-radius: 8px; border-left: 4px solid #3B82F6;">
      <h3 style="color: #1F2937; margin: 0 0 16px 0; font-size: 18px; font-weight: 600;">
        🚀 What's Next?
      </h3>
      <ul style="color: #4B5563; margin: 0; padding-left: 20px; line-height: 1.6;">
        <li style="margin-bottom: 8px;">Access your personalized dashboard</li>
        <li style="margin-bottom: 8px;">Start your first backlink campaign</li>
        <li style="margin-bottom: 8px;">Use our AI-powered SEO tools</li>
        <li style="margin-bottom: 8px;">Track your ranking improvements</li>
      </ul>
    </div>
  </div>

  <!-- Footer -->
  <div style="background: #F9FAFB; padding: 24px 30px; text-align: center; border-top: 1px solid #E5E7EB;">
    <p style="color: #6B7280; margin: 0 0 8px 0; font-size: 14px;">
      Need help? Contact our support team at 
      <a href="mailto:support@backlinkoo.com" style="color: #3B82F6; text-decoration: none;">support@backlinkoo.com</a>
    </p>
    <p style="color: #9CA3AF; margin: 0; font-size: 12px;">
      © 2024 Backlink ∞. All rights reserved.<br>
      <a href="https://backlinkoo.com" style="color: #6B7280; text-decoration: none;">backlinkoo.com</a>
    </p>
  </div>
</div>
  `,
  redirectTo: 'https://backlinkoo.com/auth/confirm'
};

/**
 * Password reset email template for Supabase Auth
 */
export const PASSWORD_RESET_EMAIL_TEMPLATE: EmailTemplateConfig = {
  subject: 'Reset Your Password - Backlink ∞',
  body: `
<div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif; max-width: 600px; margin: 0 auto; background: #ffffff;">
  <!-- Header -->
  <div style="background: linear-gradient(135deg, #3B82F6 0%, #8B5CF6 100%); padding: 30px 20px; text-align: center;">
    <h1 style="color: white; margin: 0; font-size: 28px; font-weight: 700; letter-spacing: -0.5px;">
      🔗 Backlink ∞
    </h1>
  </div>

  <!-- Main Content -->
  <div style="padding: 40px 30px; background: #ffffff;">
    <h2 style="color: #1F2937; margin: 0 0 20px 0; font-size: 24px; font-weight: 600;">
      Reset Your Password
    </h2>
    
    <p style="color: #4B5563; line-height: 1.6; margin: 0 0 24px 0; font-size: 16px;">
      You requested a password reset for your Backlink ∞ account. Click the button below to set a new password.
    </p>

    <!-- CTA Button -->
    <div style="text-align: center; margin: 32px 0;">
      <a href="{{ .ConfirmationURL }}" 
         style="display: inline-block; background: linear-gradient(135deg, #3B82F6 0%, #8B5CF6 100%); color: white; padding: 16px 32px; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 16px; letter-spacing: 0.5px; box-shadow: 0 4px 12px rgba(59, 130, 246, 0.3);">
        🔐 Reset Password
      </a>
    </div>

    <p style="color: #6B7280; line-height: 1.6; margin: 24px 0 0 0; font-size: 14px;">
      If you didn't request this password reset, you can safely ignore this email. Your password will remain unchanged.
    </p>

    <p style="color: #6B7280; line-height: 1.6; margin: 16px 0 0 0; font-size: 14px;">
      If the button above doesn't work, copy and paste this link into your browser:<br>
      <a href="{{ .ConfirmationURL }}" style="color: #3B82F6; word-break: break-all;">{{ .ConfirmationURL }}</a>
    </p>
  </div>

  <!-- Footer -->
  <div style="background: #F9FAFB; padding: 24px 30px; text-align: center; border-top: 1px solid #E5E7EB;">
    <p style="color: #6B7280; margin: 0 0 8px 0; font-size: 14px;">
      Need help? Contact our support team at 
      <a href="mailto:support@backlinkoo.com" style="color: #3B82F6; text-decoration: none;">support@backlinkoo.com</a>
    </p>
    <p style="color: #9CA3AF; margin: 0; font-size: 12px;">
      © 2024 Backlink ∞. All rights reserved.
    </p>
  </div>
</div>
  `,
  redirectTo: 'https://backlinkoo.com/auth/reset-password'
};

/**
 * Configuration instructions for Supabase Dashboard
 */
export const SUPABASE_CONFIGURATION_INSTRUCTIONS = {
  steps: [
    {
      step: 1,
      title: 'Navigate to Supabase Dashboard',
      description: 'Go to your Supabase project dashboard',
      action: 'Open https://supabase.com/dashboard/project/[your-project-id]'
    },
    {
      step: 2,
      title: 'Access Authentication Settings',
      description: 'Click on Authentication in the sidebar, then Email Templates',
      action: 'Navigate to Authentication → Email Templates'
    },
    {
      step: 3,
      title: 'Configure Confirm Signup Template',
      description: 'Select "Confirm signup" template and update with our custom template',
      action: 'Paste the confirmation email template from above'
    },
    {
      step: 4,
      title: 'Configure Reset Password Template',
      description: 'Select "Reset password" template and update with our custom template',
      action: 'Paste the password reset email template from above'
    },
    {
      step: 5,
      title: 'Set Environment Variables',
      description: 'Add email service configuration',
      action: 'Go to Project Settings → Environment Variables and add RESEND_API_KEY'
    },
    {
      step: 6,
      title: 'Configure SMTP Settings',
      description: 'Set up custom SMTP if using Resend',
      action: 'In Auth settings, configure SMTP with Resend credentials'
    }
  ],
  
  environment_variables: {
    RESEND_API_KEY: 're_f2ixyRAw_EA1dtQCo9KnANfJgrgqfXFEq',
    SMTP_HOST: 'smtp.resend.com',
    SMTP_PORT: '465',
    SMTP_USER: 'resend',
    SMTP_PASS: 're_f2ixyRAw_EA1dtQCo9KnANfJgrgqfXFEq'
  },

  redirect_urls: {
    site_url: 'https://backlinkoo.com',
    redirect_urls: [
      'https://backlinkoo.com/auth/confirm',
      'https://backlinkoo.com/auth/reset-password',
      'https://backlinkoo.com/auth/callback'
    ]
  }
};

/**
 * Test Supabase email configuration
 */
export const testSupabaseEmailConfig = async (testEmail: string = 'test@example.com') => {
  console.log('🔧 Testing Supabase Email Configuration...\n');

  const results = {
    environmentCheck: false,
    authAvailable: false,
    emailDelivery: false,
    recommendations: [] as string[]
  };

  // Check environment variables
  const hasSupabaseUrl = !!import.meta.env.VITE_SUPABASE_URL;
  const hasSupabaseKey = !!import.meta.env.VITE_SUPABASE_ANON_KEY;
  const hasResendKey = !!(import.meta.env.RESEND_API_KEY || import.meta.env.VITE_RESEND_API_KEY);

  results.environmentCheck = hasSupabaseUrl && hasSupabaseKey;

  if (!results.environmentCheck) {
    results.recommendations.push('Configure Supabase environment variables (URL and ANON_KEY)');
  }

  if (!hasResendKey) {
    results.recommendations.push('Set RESEND_API_KEY environment variable');
  }

  // Test auth availability
  try {
    const { supabase } = await import('../integrations/supabase/client');
    const { data, error } = await supabase.auth.getSession();
    results.authAvailable = !error || error.message.includes('session_not_found');

    if (!results.authAvailable && error) {
      results.recommendations.push(`Fix Supabase auth issue: ${error.message}`);
    }
  } catch (error: any) {
    results.recommendations.push(`Supabase client error: ${error.message}`);
  }

  // Provide configuration recommendations
  if (results.environmentCheck && results.authAvailable) {
    results.recommendations.push('✅ Basic configuration looks good');
    results.recommendations.push('Configure email templates in Supabase Dashboard → Authentication → Email Templates');
    results.recommendations.push('Set redirect URLs in Supabase Dashboard → Authentication → URL Configuration');
    results.recommendations.push('Add RESEND_API_KEY to Supabase Dashboard → Project Settings → Environment Variables');
  }

  console.log('📊 Configuration Test Results:');
  console.log(`Environment: ${results.environmentCheck ? '✅' : '❌'}`);
  console.log(`Auth Available: ${results.authAvailable ? '✅' : '❌'}`);
  console.log(`Resend Key: ${hasResendKey ? '✅' : '❌'}`);

  console.log('\n💡 Recommendations:');
  results.recommendations.forEach((rec, index) => {
    console.log(`${index + 1}. ${rec}`);
  });

  return results;
};
