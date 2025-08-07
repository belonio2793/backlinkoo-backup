// Script to manually create affiliate tables
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  console.error('❌ Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

console.log('🔄 Creating affiliate tables...');

const createAffiliateTables = async () => {
  try {
    // Run the SQL to create affiliate_programs table
    const sql = `
-- Create affiliate_programs table
CREATE TABLE IF NOT EXISTS affiliate_programs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    affiliate_code VARCHAR(50) UNIQUE NOT NULL,
    custom_id VARCHAR(8) UNIQUE NOT NULL,
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'suspended')),
    commission_rate DECIMAL(3,2) DEFAULT 0.50 CHECK (commission_rate >= 0 AND commission_rate <= 1),
    total_earnings DECIMAL(10,2) DEFAULT 0.00,
    total_paid DECIMAL(10,2) DEFAULT 0.00,
    pending_earnings DECIMAL(10,2) DEFAULT 0.00,
    referral_url TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create affiliate_referrals table
CREATE TABLE IF NOT EXISTS affiliate_referrals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    affiliate_id UUID NOT NULL REFERENCES affiliate_programs(id) ON DELETE CASCADE,
    referred_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    referral_code VARCHAR(50) NOT NULL,
    source_url TEXT,
    conversion_date TIMESTAMP WITH TIME ZONE,
    total_spend DECIMAL(10,2) DEFAULT 0.00,
    commission_earned DECIMAL(10,2) DEFAULT 0.00,
    commission_paid BOOLEAN DEFAULT FALSE,
    payment_date TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create affiliate_payments table
CREATE TABLE IF NOT EXISTS affiliate_payments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    affiliate_id UUID NOT NULL REFERENCES affiliate_programs(id) ON DELETE CASCADE,
    amount DECIMAL(10,2) NOT NULL CHECK (amount > 0),
    payment_method VARCHAR(20) NOT NULL CHECK (payment_method IN ('paypal', 'bank_transfer', 'crypto')),
    payment_reference VARCHAR(255),
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
    processed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create affiliate_clicks table for tracking
CREATE TABLE IF NOT EXISTS affiliate_clicks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    affiliate_id UUID NOT NULL REFERENCES affiliate_programs(id) ON DELETE CASCADE,
    source_url TEXT,
    user_agent TEXT,
    ip_address INET,
    clicked_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_affiliate_programs_user_id ON affiliate_programs(user_id);
CREATE INDEX IF NOT EXISTS idx_affiliate_programs_affiliate_code ON affiliate_programs(affiliate_code);
CREATE INDEX IF NOT EXISTS idx_affiliate_programs_custom_id ON affiliate_programs(custom_id);
CREATE INDEX IF NOT EXISTS idx_affiliate_referrals_affiliate_id ON affiliate_referrals(affiliate_id);
CREATE INDEX IF NOT EXISTS idx_affiliate_referrals_referred_user_id ON affiliate_referrals(referred_user_id);
CREATE INDEX IF NOT EXISTS idx_affiliate_referrals_referral_code ON affiliate_referrals(referral_code);
CREATE INDEX IF NOT EXISTS idx_affiliate_payments_affiliate_id ON affiliate_payments(affiliate_id);
CREATE INDEX IF NOT EXISTS idx_affiliate_clicks_affiliate_id ON affiliate_clicks(affiliate_id);
CREATE INDEX IF NOT EXISTS idx_affiliate_clicks_clicked_at ON affiliate_clicks(clicked_at);

-- Create updated_at trigger function if it doesn't exist
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updating updated_at columns
DROP TRIGGER IF EXISTS update_affiliate_programs_updated_at ON affiliate_programs;
CREATE TRIGGER update_affiliate_programs_updated_at 
    BEFORE UPDATE ON affiliate_programs 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_affiliate_referrals_updated_at ON affiliate_referrals;
CREATE TRIGGER update_affiliate_referrals_updated_at 
    BEFORE UPDATE ON affiliate_referrals 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_affiliate_payments_updated_at ON affiliate_payments;
CREATE TRIGGER update_affiliate_payments_updated_at 
    BEFORE UPDATE ON affiliate_payments 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Set up Row Level Security (RLS)
ALTER TABLE affiliate_programs ENABLE ROW LEVEL SECURITY;
ALTER TABLE affiliate_referrals ENABLE ROW LEVEL SECURITY;
ALTER TABLE affiliate_payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE affiliate_clicks ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view their own affiliate programs" ON affiliate_programs;
DROP POLICY IF EXISTS "Users can create their own affiliate programs" ON affiliate_programs;
DROP POLICY IF EXISTS "Users can update their own affiliate programs" ON affiliate_programs;

-- RLS Policies for affiliate_programs
CREATE POLICY "Users can view their own affiliate programs" ON affiliate_programs
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own affiliate programs" ON affiliate_programs
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own affiliate programs" ON affiliate_programs
    FOR UPDATE USING (auth.uid() = user_id);

-- Drop existing referral policies
DROP POLICY IF EXISTS "Affiliates can view their own referrals" ON affiliate_referrals;
DROP POLICY IF EXISTS "System can create referrals" ON affiliate_referrals;
DROP POLICY IF EXISTS "Affiliates can update their own referrals" ON affiliate_referrals;

-- RLS Policies for affiliate_referrals
CREATE POLICY "Affiliates can view their own referrals" ON affiliate_referrals
    FOR SELECT USING (
        affiliate_id IN (
            SELECT id FROM affiliate_programs WHERE user_id = auth.uid()
        )
    );

CREATE POLICY "System can create referrals" ON affiliate_referrals
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Affiliates can update their own referrals" ON affiliate_referrals
    FOR UPDATE USING (
        affiliate_id IN (
            SELECT id FROM affiliate_programs WHERE user_id = auth.uid()
        )
    );

-- Drop existing payment policies
DROP POLICY IF EXISTS "Affiliates can view their own payments" ON affiliate_payments;
DROP POLICY IF EXISTS "Affiliates can create payment requests" ON affiliate_payments;

-- RLS Policies for affiliate_payments
CREATE POLICY "Affiliates can view their own payments" ON affiliate_payments
    FOR SELECT USING (
        affiliate_id IN (
            SELECT id FROM affiliate_programs WHERE user_id = auth.uid()
        )
    );

CREATE POLICY "Affiliates can create payment requests" ON affiliate_payments
    FOR INSERT WITH CHECK (
        affiliate_id IN (
            SELECT id FROM affiliate_programs WHERE user_id = auth.uid()
        )
    );

-- Drop existing click policies
DROP POLICY IF EXISTS "Affiliates can view their own clicks" ON affiliate_clicks;
DROP POLICY IF EXISTS "System can create click records" ON affiliate_clicks;

-- RLS Policies for affiliate_clicks
CREATE POLICY "Affiliates can view their own clicks" ON affiliate_clicks
    FOR SELECT USING (
        affiliate_id IN (
            SELECT id FROM affiliate_programs WHERE user_id = auth.uid()
        )
    );

CREATE POLICY "System can create click records" ON affiliate_clicks
    FOR INSERT WITH CHECK (true);
`;

    const { data, error } = await supabase.rpc('exec_sql', { sql_query: sql });

    if (error) {
      console.error('❌ Error executing SQL:', error);
      return;
    }

    console.log('✅ Affiliate tables created successfully');

    // Test table creation by checking if affiliate_programs exists
    const { data: testData, error: testError } = await supabase
      .from('affiliate_programs')
      .select('id')
      .limit(1);

    if (testError) {
      console.error('❌ Table verification failed:', testError);
    } else {
      console.log('✅ Tables verified - affiliate system ready');
    }

  } catch (error) {
    console.error('❌ Script error:', error);
  }
};

createAffiliateTables();
