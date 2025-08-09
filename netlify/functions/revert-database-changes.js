import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

export const handler = async (event, context) => {
  // Only allow POST requests
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      body: JSON.stringify({ error: 'Method not allowed' })
    };
  }

  try {
    console.log('🔄 Starting database revert process...');

    // Read the revert SQL script
    const revertSQL = `
      -- REVERT RECENT DATABASE CHANGES
      -- =============================================================================

      -- STEP 1: REVERT AFFILIATE PROGRAM TABLES
      DROP TABLE IF EXISTS public.affiliate_clicks CASCADE;
      DROP TABLE IF EXISTS public.affiliate_commissions CASCADE;
      DROP TABLE IF EXISTS public.affiliate_referrals CASCADE;
      DROP TABLE IF EXISTS public.affiliate_profiles CASCADE;
      DROP TABLE IF EXISTS public.affiliate_settings CASCADE;

      -- Drop affiliate-related functions
      DROP FUNCTION IF EXISTS public.generate_affiliate_id() CASCADE;
      DROP FUNCTION IF EXISTS public.set_affiliate_id() CASCADE;

      -- Drop affiliate-related views
      DROP VIEW IF EXISTS public.affiliate_dashboard_stats CASCADE;

      -- STEP 2: REVERT ADMIN USER CHANGES (CAREFUL - Only remove if they exist)
      DELETE FROM public.profiles WHERE email = 'support@backlinkoo.com';
      DELETE FROM auth.users WHERE email = 'support@backlinkoo.com';

      -- STEP 3: REVERT RLS POLICY CHANGES
      ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

      -- Remove problematic policies
      DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;
      DROP POLICY IF EXISTS "Admins can manage all profiles" ON public.profiles;
      DROP POLICY IF EXISTS "Admins can update any profile" ON public.profiles;
      DROP POLICY IF EXISTS "Admins can insert profiles" ON public.profiles;
      DROP POLICY IF EXISTS "Admins can delete profiles" ON public.profiles;
      DROP POLICY IF EXISTS "Admins can insert any profile" ON public.profiles;

      -- STEP 4: CLEAN UP PERMISSIONS
      REVOKE ALL PRIVILEGES ON ALL TABLES IN SCHEMA public FROM public;
      REVOKE ALL PRIVILEGES ON ALL TABLES IN SCHEMA public FROM anon;

      -- Restore minimal necessary permissions
      GRANT USAGE ON SCHEMA public TO anon, authenticated;
      GRANT SELECT ON public.blog_posts TO anon, authenticated;
      GRANT SELECT, INSERT, UPDATE ON public.profiles TO authenticated;

      -- STEP 5: REMOVE PROBLEMATIC FUNCTIONS
      DROP FUNCTION IF EXISTS public.get_current_user_role() CASCADE;
      DROP FUNCTION IF EXISTS public.is_admin() CASCADE;
      DROP FUNCTION IF EXISTS public.get_user_profile() CASCADE;

      -- STEP 6: REMOVE TRIGGERS
      DROP TRIGGER IF EXISTS trigger_set_affiliate_id ON public.affiliate_profiles;
    `;

    // Execute the revert script step by step
    const steps = revertSQL.split(';').filter(step => step.trim().length > 0);
    const results = [];
    let errors = [];

    for (let i = 0; i < steps.length; i++) {
      const step = steps[i].trim();
      if (step && !step.startsWith('--')) {
        try {
          console.log(`Executing step ${i + 1}: ${step.substring(0, 50)}...`);
          const { data, error } = await supabase.rpc('exec', { sql: step });
          
          if (error) {
            console.warn(`Step ${i + 1} warning:`, error.message);
            errors.push(`Step ${i + 1}: ${error.message}`);
          } else {
            results.push(`Step ${i + 1}: Success`);
          }
        } catch (err) {
          console.warn(`Step ${i + 1} error (continuing):`, err.message);
          errors.push(`Step ${i + 1}: ${err.message}`);
        }
      }
    }

    console.log('✅ Database revert process completed');

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS'
      },
      body: JSON.stringify({
        success: true,
        message: 'Database revert completed',
        results: results,
        warnings: errors,
        summary: `Processed ${steps.length} steps, ${results.length} succeeded, ${errors.length} warnings`
      })
    };

  } catch (error) {
    console.error('❌ Database revert failed:', error);
    
    return {
      statusCode: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS'
      },
      body: JSON.stringify({
        success: false,
        error: error.message,
        message: 'Database revert failed'
      })
    };
  }
};
