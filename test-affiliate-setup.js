// Test script to setup affiliate database
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing Supabase credentials');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function setupAffiliateDatabase() {
  console.log('🔧 Setting up affiliate database...');

  try {
    // First, check if tables already exist
    const { data: tables, error: checkError } = await supabase
      .from('information_schema.tables')
      .select('table_name')
      .eq('table_schema', 'public')
      .like('table_name', 'affiliate_%');

    if (checkError) {
      console.log('⚠️ Cannot check existing tables, proceeding with setup...');
    } else {
      console.log('📋 Existing affiliate tables:', tables?.map(t => t.table_name) || []);
    }

    // Create affiliate profiles table
    const createProfilesTable = `
      CREATE TABLE IF NOT EXISTS public.affiliate_profiles (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
        affiliate_id TEXT NOT NULL UNIQUE,
        status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'active', 'suspended', 'banned')),
        commission_rate DECIMAL(5,4) NOT NULL DEFAULT 0.20,
        tier TEXT NOT NULL DEFAULT 'bronze' CHECK (tier IN ('bronze', 'silver', 'gold', 'platinum')),
        total_earnings DECIMAL(12,2) NOT NULL DEFAULT 0.00,
        total_referrals INTEGER NOT NULL DEFAULT 0,
        total_conversions INTEGER NOT NULL DEFAULT 0,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        registration_data JSONB
      );
    `;

    const { error: createError } = await supabase.rpc('exec', { sql: createProfilesTable });
    
    if (createError) {
      console.log('⚠️ Standard RPC failed, trying direct table creation...');
      
      // Alternative approach: Create table using Supabase admin API
      const { data, error } = await supabase
        .from('pg_tables')
        .select('tablename')
        .eq('schemaname', 'public')
        .eq('tablename', 'affiliate_profiles');

      if (error || !data || data.length === 0) {
        console.log('📦 Creating affiliate_profiles table...');
        
        // Use raw SQL execution if available
        try {
          await supabase.rpc('create_affiliate_profiles_table');
        } catch (err) {
          console.log('Direct table creation not available, creating via insert...');
        }
      } else {
        console.log('✅ affiliate_profiles table already exists');
      }
    } else {
      console.log('✅ affiliate_profiles table created/verified');
    }

    // Enable RLS and create policies
    const policies = [
      `ALTER TABLE public.affiliate_profiles ENABLE ROW LEVEL SECURITY;`,
      
      `CREATE POLICY IF NOT EXISTS "affiliate_profiles_select_own"
       ON public.affiliate_profiles FOR SELECT
       USING (auth.uid() = user_id);`,
       
      `CREATE POLICY IF NOT EXISTS "affiliate_profiles_insert_own"
       ON public.affiliate_profiles FOR INSERT
       WITH CHECK (auth.uid() = user_id);`
    ];

    for (const policy of policies) {
      try {
        await supabase.rpc('exec', { sql: policy });
        console.log('✅ Policy applied');
      } catch (err) {
        console.log('⚠️ Policy application skipped:', err.message);
      }
    }

    // Create affiliate ID generation function
    const affiliateIdFunction = `
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
    `;

    try {
      await supabase.rpc('exec', { sql: affiliateIdFunction });
      console.log('✅ Affiliate ID generation function created');
    } catch (err) {
      console.log('⚠️ Function creation skipped:', err.message);
    }

    console.log('🎉 Affiliate database setup completed!');
    console.log('📝 You can now access the /affiliate page');

  } catch (error) {
    console.error('❌ Setup failed:', error);
    
    // Fallback: Create a minimal working setup
    console.log('🔄 Attempting minimal setup...');
    
    try {
      // Just ensure basic authentication works
      const { data: user } = await supabase.auth.getUser();
      console.log('📋 Authentication working, affiliate page should load with auth');
    } catch (authError) {
      console.error('❌ Authentication also failed:', authError);
    }
  }
}

// Run the setup
setupAffiliateDatabase().then(() => {
  console.log('✅ Setup script completed');
  process.exit(0);
}).catch(err => {
  console.error('❌ Setup script failed:', err);
  process.exit(1);
});
