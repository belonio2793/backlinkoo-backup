-- Security Fix Migration: Implement proper role-based access control
-- and fix function security vulnerabilities

-- 1. Create proper user roles system
CREATE TYPE public.user_role_type AS ENUM ('admin', 'moderator', 'user');

-- Create separate user_roles table for proper role management
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  role user_role_type NOT NULL DEFAULT 'user',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_by UUID, -- admin who assigned the role
  UNIQUE(user_id, role)
);

-- Enable RLS on user_roles
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- 2. Create secure role checking function with proper search path
CREATE OR REPLACE FUNCTION public.get_user_role(check_user_id UUID DEFAULT NULL)
RETURNS user_role_type
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  target_user_id UUID;
  user_role user_role_type;
BEGIN
  target_user_id := COALESCE(check_user_id, auth.uid());
  
  SELECT role INTO user_role
  FROM public.user_roles
  WHERE user_id = target_user_id
  LIMIT 1;
  
  -- Default to 'user' if no role found
  RETURN COALESCE(user_role, 'user'::user_role_type);
END;
$$;

-- 3. Create admin-only role assignment function
CREATE OR REPLACE FUNCTION public.assign_user_role(target_user_id UUID, new_role user_role_type)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  -- Only admins can assign roles
  IF public.get_user_role() != 'admin' THEN
    RAISE EXCEPTION 'Only administrators can assign roles';
  END IF;
  
  -- Insert or update user role
  INSERT INTO public.user_roles (user_id, role, created_by)
  VALUES (target_user_id, new_role, auth.uid())
  ON CONFLICT (user_id, role) 
  DO UPDATE SET created_by = auth.uid();
  
  RETURN TRUE;
END;
$$;

-- 4. Fix existing security definer function with proper search path
CREATE OR REPLACE FUNCTION public.get_current_user_role()
RETURNS app_role
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  RETURN (SELECT role FROM public.profiles WHERE user_id = auth.uid() LIMIT 1);
END;
$$;

-- 5. Update handle_new_user function with proper search path
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  INSERT INTO public.profiles (user_id, email, display_name)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'display_name', NEW.email)
  );
  
  INSERT INTO public.credits (user_id, amount)
  VALUES (NEW.id, 0);
  
  -- Assign default user role
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'user');
  
  RETURN NEW;
END;
$$;

-- 6. Create RLS policies for user_roles table
-- Users can only view their own roles
CREATE POLICY "Users can view their own roles"
ON public.user_roles
FOR SELECT
USING (auth.uid() = user_id);

-- Only admins can manage roles
CREATE POLICY "Admins can manage all roles"
ON public.user_roles
FOR ALL
USING (public.get_user_role() = 'admin');

-- 7. Restrict profiles table role updates - users cannot change their own role
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;

CREATE POLICY "Users can update their own profile (except role)"
ON public.profiles
FOR UPDATE
USING (auth.uid() = user_id);

-- 8. Add audit logging table for security events
CREATE TABLE public.security_audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID,
  action TEXT NOT NULL,
  resource TEXT,
  details JSONB,
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on audit log
ALTER TABLE public.security_audit_log ENABLE ROW LEVEL SECURITY;

-- Only admins can view audit logs
CREATE POLICY "Admins can view audit logs"
ON public.security_audit_log
FOR SELECT
USING (public.get_user_role() = 'admin');

-- System can insert audit logs
CREATE POLICY "System can insert audit logs"
ON public.security_audit_log
FOR INSERT
WITH CHECK (true);