-- Final affiliate tables migration
-- This creates the affiliate_programs table that SafeAffiliateProgram.tsx expects

-- Drop existing table if it exists (to ensure clean setup)
DROP TABLE IF EXISTS affiliate_programs CASCADE;

-- Create affiliate_programs table
CREATE TABLE affiliate_programs (
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

-- Create indexes for better performance
CREATE INDEX idx_affiliate_programs_user_id ON affiliate_programs(user_id);
CREATE INDEX idx_affiliate_programs_affiliate_code ON affiliate_programs(affiliate_code);
CREATE INDEX idx_affiliate_programs_custom_id ON affiliate_programs(custom_id);

-- Create updated_at trigger function if it doesn't exist
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger for updating updated_at column
CREATE TRIGGER update_affiliate_programs_updated_at 
    BEFORE UPDATE ON affiliate_programs 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Enable Row Level Security
ALTER TABLE affiliate_programs ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can view their own affiliate programs" ON affiliate_programs
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own affiliate programs" ON affiliate_programs
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own affiliate programs" ON affiliate_programs
    FOR UPDATE USING (auth.uid() = user_id);

-- Grant permissions
GRANT ALL ON affiliate_programs TO authenticated;
GRANT ALL ON affiliate_programs TO anon;
