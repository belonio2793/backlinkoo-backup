-- Gift 500 credits to labindalawamaryrose@gmail.com for testing
DO $$
DECLARE
    target_user_id uuid;
BEGIN
    -- Find the user by email
    SELECT user_id INTO target_user_id 
    FROM public.profiles 
    WHERE email = 'labindalawamaryrose@gmail.com';
    
    -- Check if user exists
    IF target_user_id IS NULL THEN
        RAISE EXCEPTION 'User with email labindalawamaryrose@gmail.com not found';
    END IF;
    
    -- Update credits table - add 500 credits
    UPDATE public.credits 
    SET 
        amount = amount + 500,
        total_purchased = total_purchased + 500,
        updated_at = now()
    WHERE user_id = target_user_id;
    
    -- Insert transaction record
    INSERT INTO public.credit_transactions (
        user_id,
        amount,
        type,
        description,
        created_at
    ) VALUES (
        target_user_id,
        500,
        'gift',
        'Testing credits - gifted by admin',
        now()
    );
    
    RAISE NOTICE 'Successfully gifted 500 credits to labindalawamaryrose@gmail.com';
END $$;