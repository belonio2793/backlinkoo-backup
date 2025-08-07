import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

export const handler = async (event, context) => {
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      body: JSON.stringify({ error: 'Method not allowed' })
    };
  }

  try {
    console.log('Setting up affiliate database...');

    // SQL to create affiliate tables
    const setupSQL = `
      -- Ensure extensions are available
      CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

      -- =============================================================================
      -- AFFILIATE PROFILES TABLE
      -- =============================================================================
      CREATE TABLE IF NOT EXISTS public.affiliate_profiles (
          id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
          user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
          affiliate_id TEXT NOT NULL UNIQUE,
          status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'active', 'suspended', 'banned')),
          commission_rate DECIMAL(5,4) NOT NULL DEFAULT 0.20,
          tier TEXT NOT NULL DEFAULT 'bronze' CHECK (tier IN ('bronze', 'silver', 'gold', 'platinum', 'partner')),
          total_earnings DECIMAL(12,2) NOT NULL DEFAULT 0.00,
          total_referrals INTEGER NOT NULL DEFAULT 0,
          total_conversions INTEGER NOT NULL DEFAULT 0,
          lifetime_value DECIMAL(12,2) NOT NULL DEFAULT 0.00,
          created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
          updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
          approved_at TIMESTAMPTZ,
          payout_method TEXT CHECK (payout_method IN ('paypal', 'stripe', 'crypto', 'bank')),
          payout_details JSONB,
          registration_data JSONB
      );

      -- Create unique constraint for active affiliates
      CREATE UNIQUE INDEX IF NOT EXISTS unique_active_affiliate_per_user 
      ON public.affiliate_profiles(user_id) 
      WHERE status = 'active';

      -- =============================================================================
      -- AFFILIATE REFERRALS TABLE
      -- =============================================================================
      CREATE TABLE IF NOT EXISTS public.affiliate_referrals (
          id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
          affiliate_id TEXT NOT NULL,
          referral_code TEXT NOT NULL,
          referred_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
          visitor_ip INET NOT NULL,
          user_agent TEXT NOT NULL,
          utm_source TEXT,
          utm_medium TEXT,
          utm_campaign TEXT,
          utm_content TEXT,
          landing_page TEXT NOT NULL,
          referer TEXT,
          conversion_status TEXT NOT NULL DEFAULT 'pending' CHECK (conversion_status IN ('pending', 'converted', 'expired')),
          conversion_value DECIMAL(12,2),
          commission_earned DECIMAL(12,2),
          clicked_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
          converted_at TIMESTAMPTZ,
          expires_at TIMESTAMPTZ NOT NULL DEFAULT (NOW() + INTERVAL '30 days'),
          device_fingerprint TEXT,
          session_id TEXT,
          country TEXT,
          device_type TEXT CHECK (device_type IN ('desktop', 'mobile', 'tablet')),
          browser TEXT,
          os TEXT
      );

      -- =============================================================================
      -- AFFILIATE COMMISSIONS TABLE
      -- =============================================================================
      CREATE TABLE IF NOT EXISTS public.affiliate_commissions (
          id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
          affiliate_id TEXT NOT NULL,
          referral_id UUID,
          user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
          commission_type TEXT NOT NULL CHECK (commission_type IN ('signup', 'subscription', 'purchase', 'bonus')),
          amount DECIMAL(12,2) NOT NULL,
          percentage DECIMAL(5,4) NOT NULL,
          order_value DECIMAL(12,2) NOT NULL,
          status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'paid', 'disputed')),
          created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
          approved_at TIMESTAMPTZ,
          paid_at TIMESTAMPTZ,
          payment_id TEXT,
          notes TEXT
      );

      -- =============================================================================
      -- AFFILIATE CLICKS TABLE
      -- =============================================================================
      CREATE TABLE IF NOT EXISTS public.affiliate_clicks (
          id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
          affiliate_id TEXT NOT NULL,
          referral_code TEXT NOT NULL,
          visitor_ip INET NOT NULL,
          user_agent TEXT NOT NULL,
          referer TEXT,
          utm_params JSONB,
          landing_page TEXT NOT NULL,
          device_type TEXT CHECK (device_type IN ('desktop', 'mobile', 'tablet')),
          browser TEXT,
          os TEXT,
          country TEXT,
          clicked_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );

      -- =============================================================================
      -- AFFILIATE SETTINGS TABLE
      -- =============================================================================
      CREATE TABLE IF NOT EXISTS public.affiliate_settings (
          id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
          minimum_payout DECIMAL(10,2) NOT NULL DEFAULT 50.00,
          default_commission_rate DECIMAL(5,4) NOT NULL DEFAULT 0.20,
          payout_schedule TEXT NOT NULL DEFAULT 'monthly' CHECK (payout_schedule IN ('weekly', 'bi_weekly', 'monthly')),
          auto_approve_affiliates BOOLEAN NOT NULL DEFAULT false,
          require_tax_info BOOLEAN NOT NULL DEFAULT false,
          created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
          updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );

      -- Insert default settings if none exist
      INSERT INTO public.affiliate_settings (id) 
      SELECT uuid_generate_v4()
      WHERE NOT EXISTS (SELECT 1 FROM public.affiliate_settings);

      -- =============================================================================
      -- CREATE INDEXES
      -- =============================================================================
      CREATE INDEX IF NOT EXISTS idx_affiliate_profiles_affiliate_id ON public.affiliate_profiles(affiliate_id);
      CREATE INDEX IF NOT EXISTS idx_affiliate_profiles_user_id ON public.affiliate_profiles(user_id);
      CREATE INDEX IF NOT EXISTS idx_affiliate_profiles_status ON public.affiliate_profiles(status);

      CREATE INDEX IF NOT EXISTS idx_affiliate_referrals_affiliate_id ON public.affiliate_referrals(affiliate_id);
      CREATE INDEX IF NOT EXISTS idx_affiliate_referrals_referral_code ON public.affiliate_referrals(referral_code);
      CREATE INDEX IF NOT EXISTS idx_affiliate_referrals_status ON public.affiliate_referrals(conversion_status);

      CREATE INDEX IF NOT EXISTS idx_affiliate_commissions_affiliate_id ON public.affiliate_commissions(affiliate_id);
      CREATE INDEX IF NOT EXISTS idx_affiliate_commissions_status ON public.affiliate_commissions(status);

      CREATE INDEX IF NOT EXISTS idx_affiliate_clicks_affiliate_id ON public.affiliate_clicks(affiliate_id);
      CREATE INDEX IF NOT EXISTS idx_affiliate_clicks_clicked_at ON public.affiliate_clicks(clicked_at);

      -- =============================================================================
      -- AFFILIATE ID GENERATION FUNCTION
      -- =============================================================================
      CREATE OR REPLACE FUNCTION generate_affiliate_id()
      RETURNS TEXT AS $$
      DECLARE
          new_id TEXT;
          counter INTEGER := 0;
      BEGIN
          LOOP
              new_id := 'BL' || UPPER(SUBSTR(MD5(RANDOM()::TEXT), 1, 6));
              counter := counter + 1;
              
              EXIT WHEN NOT EXISTS (
                  SELECT 1 FROM public.affiliate_profiles WHERE affiliate_id = new_id
              );
              
              IF counter > 100 THEN
                  RAISE EXCEPTION 'Unable to generate unique affiliate ID after 100 attempts';
              END IF;
          END LOOP;
          
          RETURN new_id;
      END;
      $$ LANGUAGE plpgsql;

      -- =============================================================================
      -- TRIGGER FUNCTION FOR AUTO-GENERATING AFFILIATE IDS
      -- =============================================================================
      CREATE OR REPLACE FUNCTION set_affiliate_id()
      RETURNS TRIGGER AS $$
      BEGIN
          IF NEW.affiliate_id IS NULL OR NEW.affiliate_id = '' THEN
              NEW.affiliate_id := generate_affiliate_id();
          END IF;
          RETURN NEW;
      END;
      $$ LANGUAGE plpgsql;

      -- Create trigger
      DROP TRIGGER IF EXISTS trigger_set_affiliate_id ON public.affiliate_profiles;
      CREATE TRIGGER trigger_set_affiliate_id
          BEFORE INSERT ON public.affiliate_profiles
          FOR EACH ROW
          EXECUTE FUNCTION set_affiliate_id();

      -- =============================================================================
      -- ROW LEVEL SECURITY POLICIES
      -- =============================================================================

      -- Enable RLS
      ALTER TABLE public.affiliate_profiles ENABLE ROW LEVEL SECURITY;
      ALTER TABLE public.affiliate_referrals ENABLE ROW LEVEL SECURITY;
      ALTER TABLE public.affiliate_commissions ENABLE ROW LEVEL SECURITY;
      ALTER TABLE public.affiliate_clicks ENABLE ROW LEVEL SECURITY;
      ALTER TABLE public.affiliate_settings ENABLE ROW LEVEL SECURITY;

      -- Drop existing policies to avoid conflicts
      DROP POLICY IF EXISTS "affiliate_profiles_select_own" ON public.affiliate_profiles;
      DROP POLICY IF EXISTS "affiliate_profiles_insert_own" ON public.affiliate_profiles;
      DROP POLICY IF EXISTS "affiliate_profiles_update_own" ON public.affiliate_profiles;
      DROP POLICY IF EXISTS "affiliate_profiles_admin_all" ON public.affiliate_profiles;

      -- Affiliate Profiles Policies
      CREATE POLICY "affiliate_profiles_select_own"
      ON public.affiliate_profiles FOR SELECT
      USING (auth.uid() = user_id);

      CREATE POLICY "affiliate_profiles_insert_own"
      ON public.affiliate_profiles FOR INSERT
      WITH CHECK (auth.uid() = user_id);

      CREATE POLICY "affiliate_profiles_update_own"
      ON public.affiliate_profiles FOR UPDATE
      USING (auth.uid() = user_id);

      -- Settings Policies
      CREATE POLICY "affiliate_settings_select_all"
      ON public.affiliate_settings FOR SELECT
      USING (true);

      -- =============================================================================
      -- CREATE AFFILIATE STATS VIEW
      -- =============================================================================
      CREATE OR REPLACE VIEW affiliate_dashboard_stats AS
      SELECT 
          ap.affiliate_id,
          ap.user_id,
          ap.status,
          ap.tier,
          ap.commission_rate,
          ap.total_earnings,
          ap.total_conversions,
          ap.total_referrals,
          COALESCE(COUNT(DISTINCT ac.id), 0) as total_clicks,
          COALESCE(COUNT(DISTINCT ar.id), 0) as total_referral_records,
          COALESCE(SUM(CASE WHEN acom.status = 'pending' THEN acom.amount ELSE 0 END), 0) as pending_commissions,
          COALESCE(SUM(CASE WHEN acom.status = 'paid' THEN acom.amount ELSE 0 END), 0) as paid_commissions,
          CASE 
              WHEN COUNT(DISTINCT ac.id) > 0 
              THEN ROUND((COUNT(DISTINCT ar.id)::decimal / COUNT(DISTINCT ac.id)) * 100, 2)
              ELSE 0 
          END as conversion_rate,
          CASE 
              WHEN COUNT(DISTINCT ac.id) > 0 
              THEN ROUND(ap.total_earnings / COUNT(DISTINCT ac.id), 2)
              ELSE 0 
          END as epc
      FROM public.affiliate_profiles ap
      LEFT JOIN public.affiliate_clicks ac ON ap.affiliate_id = ac.affiliate_id
      LEFT JOIN public.affiliate_referrals ar ON ap.affiliate_id = ar.affiliate_id
      LEFT JOIN public.affiliate_commissions acom ON ap.affiliate_id = acom.affiliate_id
      GROUP BY ap.affiliate_id, ap.user_id, ap.status, ap.tier, ap.commission_rate, 
               ap.total_earnings, ap.total_conversions, ap.total_referrals;

      -- Grant access to the view
      GRANT SELECT ON affiliate_dashboard_stats TO authenticated;
    `;

    // Execute the setup SQL
    const { data, error } = await supabase.rpc('exec', { sql: setupSQL });

    if (error) {
      console.error('Database setup error:', error);
      
      // Try a simpler approach - create tables one by one
      const tables = [
        // Affiliate profiles table
        `CREATE TABLE IF NOT EXISTS public.affiliate_profiles (
          id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
          user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
          affiliate_id TEXT NOT NULL UNIQUE,
          status TEXT NOT NULL DEFAULT 'pending',
          commission_rate DECIMAL(5,4) NOT NULL DEFAULT 0.20,
          tier TEXT NOT NULL DEFAULT 'bronze',
          total_earnings DECIMAL(12,2) NOT NULL DEFAULT 0.00,
          total_referrals INTEGER NOT NULL DEFAULT 0,
          total_conversions INTEGER NOT NULL DEFAULT 0,
          created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
          updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
          registration_data JSONB
        );`,
        
        // Enable RLS and create basic policies
        `ALTER TABLE public.affiliate_profiles ENABLE ROW LEVEL SECURITY;`,
        
        `CREATE POLICY IF NOT EXISTS "affiliate_profiles_select_own"
         ON public.affiliate_profiles FOR SELECT
         USING (auth.uid() = user_id);`,
         
        `CREATE POLICY IF NOT EXISTS "affiliate_profiles_insert_own"
         ON public.affiliate_profiles FOR INSERT
         WITH CHECK (auth.uid() = user_id);`,
         
        // Generate affiliate ID function
        `CREATE OR REPLACE FUNCTION generate_affiliate_id()
         RETURNS TEXT AS $$
         BEGIN
           RETURN 'BL' || UPPER(SUBSTR(MD5(RANDOM()::TEXT), 1, 6));
         END;
         $$ LANGUAGE plpgsql;`,
         
        // Trigger for auto ID generation
        `CREATE OR REPLACE FUNCTION set_affiliate_id()
         RETURNS TRIGGER AS $$
         BEGIN
           IF NEW.affiliate_id IS NULL OR NEW.affiliate_id = '' THEN
             NEW.affiliate_id := generate_affiliate_id();
           END IF;
           RETURN NEW;
         END;
         $$ LANGUAGE plpgsql;`,
         
        `CREATE TRIGGER IF NOT EXISTS trigger_set_affiliate_id
         BEFORE INSERT ON public.affiliate_profiles
         FOR EACH ROW
         EXECUTE FUNCTION set_affiliate_id();`
      ];

      // Execute each statement separately
      for (const sql of tables) {
        try {
          const { error: execError } = await supabase.from('pg_stat_activity').select('*').limit(1);
          // If we can query, try to execute the SQL
          await supabase.rpc('exec', { sql });
        } catch (err) {
          console.log('Individual statement error (may be expected):', err);
        }
      }
    }

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
        message: 'Affiliate database setup initiated',
        data: data
      })
    };

  } catch (error) {
    console.error('Setup function error:', error);
    
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
        error: error.message
      })
    };
  }
};
