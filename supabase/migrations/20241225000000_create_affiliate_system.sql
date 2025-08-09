-- Create user_referrals table to track referral relationships
CREATE TABLE user_referrals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    referrer_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    referred_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    referred_email TEXT NOT NULL,
    status TEXT CHECK (status IN ('active', 'inactive')) DEFAULT 'active',
    total_spent DECIMAL(10,2) DEFAULT 0,
    last_activity TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(referred_user_id) -- Each user can only be referred once
);

-- Create user_credits table to track credit balances
CREATE TABLE user_credits (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
    credits INTEGER NOT NULL DEFAULT 0,
    lifetime_earned INTEGER DEFAULT 0,
    lifetime_spent INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create credit_transactions table to track all credit movements
CREATE TABLE credit_transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    type TEXT CHECK (type IN ('referral_signup', 'referral_purchase', 'bonus', 'spent', 'manual')) NOT NULL,
    amount INTEGER NOT NULL, -- Can be negative for spending
    description TEXT NOT NULL,
    referral_id UUID REFERENCES user_referrals(referred_user_id),
    metadata JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX idx_user_referrals_referrer_id ON user_referrals(referrer_id);
CREATE INDEX idx_user_referrals_referred_user_id ON user_referrals(referred_user_id);
CREATE INDEX idx_user_referrals_status ON user_referrals(status);
CREATE INDEX idx_user_credits_user_id ON user_credits(user_id);
CREATE INDEX idx_credit_transactions_user_id ON credit_transactions(user_id);
CREATE INDEX idx_credit_transactions_type ON credit_transactions(type);
CREATE INDEX idx_credit_transactions_created_at ON credit_transactions(created_at);

-- Enable Row Level Security
ALTER TABLE user_referrals ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_credits ENABLE ROW LEVEL SECURITY;
ALTER TABLE credit_transactions ENABLE ROW LEVEL SECURITY;

-- RLS Policies for user_referrals
CREATE POLICY "Users can view their own referrals" ON user_referrals
    FOR SELECT USING (auth.uid() = referrer_id);

CREATE POLICY "Users can view referrals they were referred by" ON user_referrals
    FOR SELECT USING (auth.uid() = referred_user_id);

CREATE POLICY "Service role can manage referrals" ON user_referrals
    FOR ALL USING (auth.role() = 'service_role');

-- RLS Policies for user_credits
CREATE POLICY "Users can view their own credits" ON user_credits
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Service role can manage credits" ON user_credits
    FOR ALL USING (auth.role() = 'service_role');

-- RLS Policies for credit_transactions
CREATE POLICY "Users can view their own transactions" ON credit_transactions
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Service role can manage transactions" ON credit_transactions
    FOR ALL USING (auth.role() = 'service_role');

-- Function to automatically update user_credits when credit_transactions are inserted
CREATE OR REPLACE FUNCTION update_user_credits()
RETURNS TRIGGER AS $$
BEGIN
    -- Update or insert user credits
    INSERT INTO user_credits (user_id, credits, lifetime_earned, lifetime_spent, updated_at)
    VALUES (
        NEW.user_id,
        NEW.amount,
        CASE WHEN NEW.amount > 0 THEN NEW.amount ELSE 0 END,
        CASE WHEN NEW.amount < 0 THEN ABS(NEW.amount) ELSE 0 END,
        NOW()
    )
    ON CONFLICT (user_id) DO UPDATE SET
        credits = user_credits.credits + NEW.amount,
        lifetime_earned = user_credits.lifetime_earned + CASE WHEN NEW.amount > 0 THEN NEW.amount ELSE 0 END,
        lifetime_spent = user_credits.lifetime_spent + CASE WHEN NEW.amount < 0 THEN ABS(NEW.amount) ELSE 0 END,
        updated_at = NOW();

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically update credits
CREATE TRIGGER trigger_update_user_credits
    AFTER INSERT ON credit_transactions
    FOR EACH ROW
    EXECUTE FUNCTION update_user_credits();

-- Function to get affiliate statistics
CREATE OR REPLACE FUNCTION get_affiliate_stats(user_id_param UUID)
RETURNS TABLE(
    total_credits INTEGER,
    total_referrals BIGINT,
    total_earnings DECIMAL,
    this_month_credits INTEGER,
    this_month_referrals BIGINT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        COALESCE(uc.credits, 0) as total_credits,
        COALESCE(COUNT(ur.id), 0) as total_referrals,
        COALESCE(uc.credits, 0) * 3.33 as total_earnings,
        COALESCE(
            (SELECT SUM(amount) 
             FROM credit_transactions 
             WHERE user_id = user_id_param 
             AND created_at >= date_trunc('month', NOW())
             AND amount > 0), 0
        ) as this_month_credits,
        COALESCE(
            (SELECT COUNT(*) 
             FROM user_referrals 
             WHERE referrer_id = user_id_param 
             AND created_at >= date_trunc('month', NOW())), 0
        ) as this_month_referrals
    FROM user_credits uc
    FULL OUTER JOIN user_referrals ur ON uc.user_id = ur.referrer_id
    WHERE uc.user_id = user_id_param OR ur.referrer_id = user_id_param
    GROUP BY uc.credits;
END;
$$ LANGUAGE plpgsql;

-- Function to track referral from URL parameter
CREATE OR REPLACE FUNCTION track_referral_signup(
    referrer_id_param UUID,
    new_user_id_param UUID,
    new_user_email_param TEXT
)
RETURNS BOOLEAN AS $$
DECLARE
    signup_bonus INTEGER := 2;
BEGIN
    -- Insert referral record
    INSERT INTO user_referrals (
        referrer_id,
        referred_user_id,
        referred_email,
        status,
        created_at
    ) VALUES (
        referrer_id_param,
        new_user_id_param,
        new_user_email_param,
        'active',
        NOW()
    );

    -- Award signup bonus to referrer
    INSERT INTO credit_transactions (
        user_id,
        type,
        amount,
        description,
        referral_id,
        created_at
    ) VALUES (
        referrer_id_param,
        'referral_signup',
        signup_bonus,
        'New referral signup: ' || new_user_email_param,
        new_user_id_param,
        NOW()
    );

    RETURN TRUE;
EXCEPTION
    WHEN OTHERS THEN
        RETURN FALSE;
END;
$$ LANGUAGE plpgsql;

-- Function to track referral purchases
CREATE OR REPLACE FUNCTION track_referral_purchase(
    user_id_param UUID,
    amount_param DECIMAL,
    purchase_type_param TEXT -- 'credits' or 'dollars'
)
RETURNS INTEGER AS $$
DECLARE
    referrer_record RECORD;
    credits_to_award INTEGER := 0;
    description_text TEXT;
BEGIN
    -- Find referrer for this user
    SELECT ur.referrer_id, ur.referred_email
    INTO referrer_record
    FROM user_referrals ur
    WHERE ur.referred_user_id = user_id_param
    AND ur.status = 'active';

    -- If no referrer found, return 0
    IF referrer_record IS NULL THEN
        RETURN 0;
    END IF;

    -- Calculate credits to award based on purchase type
    IF purchase_type_param = 'credits' THEN
        -- Every 3 credits purchased = 1 credit for referrer
        credits_to_award := FLOOR(amount_param / 3);
        description_text := 'Referral purchase: ' || referrer_record.referred_email || ' bought ' || amount_param || ' credits';
    ELSE
        -- Every $3 spent = 1 credit for referrer
        credits_to_award := FLOOR(amount_param / 3);
        description_text := 'Referral purchase: ' || referrer_record.referred_email || ' spent $' || amount_param;
    END IF;

    -- Award credits if any are due
    IF credits_to_award > 0 THEN
        INSERT INTO credit_transactions (
            user_id,
            type,
            amount,
            description,
            referral_id,
            created_at
        ) VALUES (
            referrer_record.referrer_id,
            'referral_purchase',
            credits_to_award,
            description_text,
            user_id_param,
            NOW()
        );

        -- Update referral statistics
        UPDATE user_referrals 
        SET 
            total_spent = total_spent + amount_param,
            last_activity = NOW(),
            updated_at = NOW()
        WHERE referred_user_id = user_id_param;
    END IF;

    RETURN credits_to_award;
END;
$$ LANGUAGE plpgsql;

-- Insert some sample data for testing (remove in production)
-- Note: This assumes you have test users with these UUIDs
-- You can remove this section for production deployment

COMMENT ON TABLE user_referrals IS 'Tracks referral relationships between users';
COMMENT ON TABLE user_credits IS 'Stores user credit balances and lifetime statistics';
COMMENT ON TABLE credit_transactions IS 'Records all credit transactions for audit trail';
COMMENT ON FUNCTION get_affiliate_stats IS 'Returns comprehensive affiliate statistics for a user';
COMMENT ON FUNCTION track_referral_signup IS 'Handles new user signup from referral link';
COMMENT ON FUNCTION track_referral_purchase IS 'Processes referral commission from purchases';
