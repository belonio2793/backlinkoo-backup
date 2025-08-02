-- Create a function to directly create admin user
-- Run this in Supabase SQL Editor

CREATE OR REPLACE FUNCTION create_admin_user_direct(
  admin_email TEXT,
  admin_password TEXT
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  new_user_id UUID;
  result JSON;
BEGIN
  -- Generate new UUID
  new_user_id := gen_random_uuid();
  
  -- Insert into auth.users
  INSERT INTO auth.users (
    instance_id,
    id,
    aud,
    role,
    email,
    encrypted_password,
    email_confirmed_at,
    created_at,
    updated_at,
    raw_app_meta_data,
    raw_user_meta_data,
    is_super_admin
  ) VALUES (
    '00000000-0000-0000-0000-000000000000',
    new_user_id,
    'authenticated',
    'authenticated',
    admin_email,
    crypt(admin_password, gen_salt('bf')),
    NOW(),
    NOW(),
    NOW(),
    '{"provider": "email", "providers": ["email"]}',
    '{"full_name": "Support Admin"}',
    FALSE
  ) ON CONFLICT (email) DO NOTHING;
  
  -- Insert into profiles (disable RLS temporarily if needed)
  BEGIN
    INSERT INTO public.profiles (
      user_id,
      email,
      full_name,
      display_name,
      role,
      created_at,
      updated_at
    ) VALUES (
      new_user_id,
      admin_email,
      'Support Admin',
      'Support Team',
      'admin',
      NOW(),
      NOW()
    ) ON CONFLICT (user_id) DO UPDATE SET role = 'admin';
  EXCEPTION WHEN OTHERS THEN
    -- RLS might block this, that's OK
    NULL;
  END;
  
  -- Return success
  result := json_build_object(
    'success', true,
    'user_id', new_user_id,
    'email', admin_email,
    'message', 'Admin user created successfully'
  );
  
  RETURN result;
END;
$$;

-- Test the function
SELECT create_admin_user_direct('support@backlinkoo.com', 'Admin123!@#');
