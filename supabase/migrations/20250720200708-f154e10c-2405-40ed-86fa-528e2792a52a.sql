-- Create a security definer function to get current user role without recursion
CREATE OR REPLACE FUNCTION public.get_current_user_role()
RETURNS app_role AS $$
BEGIN
  RETURN (SELECT role FROM public.profiles WHERE user_id = auth.uid() LIMIT 1);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- Drop existing problematic policies
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;

-- Create new policies using the security definer function
CREATE POLICY "Users can view their own profile" 
ON public.profiles 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own profile" 
ON public.profiles 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own profile" 
ON public.profiles 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all profiles" 
ON public.profiles 
FOR ALL 
USING (public.get_current_user_role() = 'admin');

-- Also fix the campaigns policies that might have similar issues
DROP POLICY IF EXISTS "Admins can view all campaigns" ON public.campaigns;
DROP POLICY IF EXISTS "Admins can update campaigns" ON public.campaigns;

CREATE POLICY "Admins can view all campaigns" 
ON public.campaigns 
FOR SELECT 
USING (public.get_current_user_role() = 'admin' OR auth.uid() = user_id);

CREATE POLICY "Admins can update campaigns" 
ON public.campaigns 
FOR UPDATE 
USING (public.get_current_user_role() = 'admin' OR auth.uid() = user_id);

-- Fix credits policies
DROP POLICY IF EXISTS "Admins can manage all credits" ON public.credits;

CREATE POLICY "Admins can manage all credits" 
ON public.credits 
FOR ALL 
USING (public.get_current_user_role() = 'admin' OR auth.uid() = user_id);

-- Fix credit_transactions policies  
DROP POLICY IF EXISTS "Admins can view all transactions" ON public.credit_transactions;

CREATE POLICY "Admins can view all transactions" 
ON public.credit_transactions 
FOR ALL 
USING (public.get_current_user_role() = 'admin' OR auth.uid() = user_id);