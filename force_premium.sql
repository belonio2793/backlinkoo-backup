-- First find the user ID
-- INSERT or UPDATE premium subscription for labindalawamaryrose@gmail.com

DO $$
DECLARE
    target_user_id UUID;
    user_email TEXT := 'labindalawamaryrose@gmail.com';
BEGIN
    -- Find the user ID from auth.users
    SELECT id INTO target_user_id 
    FROM auth.users 
    WHERE email = user_email;
    
    IF target_user_id IS NULL THEN
        RAISE NOTICE 'User with email % not found', user_email;
        RETURN;
    END IF;
    
    RAISE NOTICE 'Found user ID: %', target_user_id;
    
    -- Insert or update premium subscription
    INSERT INTO premium_subscriptions (
        user_id,
        plan_type,
        status,
        current_period_start,
        current_period_end
    ) VALUES (
        target_user_id,
        'premium',
        'active',
        NOW(),
        NOW() + INTERVAL '1 year'
    )
    ON CONFLICT (user_id) DO UPDATE SET
        status = 'active',
        current_period_start = NOW(),
        current_period_end = NOW() + INTERVAL '1 year',
        updated_at = NOW();
    
    RAISE NOTICE 'Premium subscription updated for user %', user_email;
END $$;
