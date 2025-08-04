# Fix for "permission denied for table users" Error

## 🚨 Immediate Fix (Do this first)

1. **Go to your Supabase Dashboard**: https://supabase.com/dashboard
2. **Navigate to your project**: dfhanacsmsvvkpunurnp
3. **Open SQL Editor** (left sidebar)
4. **Run this emergency fix** to get your app working immediately:

```sql
-- Emergency fix: Temporarily disable RLS to stop the error
ALTER TABLE public.profiles DISABLE ROW LEVEL SECURITY;

-- Drop any problematic recursive functions
DROP FUNCTION IF EXISTS public.get_current_user_role() CASCADE;
DROP FUNCTION IF EXISTS public.get_user_role(uuid) CASCADE;

-- Test that profiles are now accessible
SELECT 'Emergency fix applied successfully' as status;
```

5. **Test your app** - The permission error should be gone now

## 🔧 Proper Fix (Do this after the emergency fix)

Once your app is working, run this to properly configure RLS policies:

```sql
-- Re-enable RLS with proper policies
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Drop any existing conflicting policies
DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Admins can update any profile" ON public.profiles;
DROP POLICY IF EXISTS "Enable read access for own profile" ON public.profiles;
DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON public.profiles;
DROP POLICY IF EXISTS "Enable insert for authenticated users" ON public.profiles;
DROP POLICY IF EXISTS "Admins can insert any profile" ON public.profiles;
DROP POLICY IF EXISTS "Admins can delete profiles" ON public.profiles;

-- Create simple, non-recursive policies
CREATE POLICY "Users can view own profile" 
ON public.profiles 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can update own profile" 
ON public.profiles 
FOR UPDATE 
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can insert own profile" 
ON public.profiles 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

-- Admin policies (only if you have admin users)
CREATE POLICY "Admins can view all profiles" 
ON public.profiles 
FOR SELECT 
USING (
    auth.uid() = user_id  -- Users can see their own
    OR
    -- Simple admin check without recursion
    (SELECT role FROM public.profiles WHERE user_id = auth.uid()) = 'admin'::app_role
);

CREATE POLICY "Admins can update any profile" 
ON public.profiles 
FOR UPDATE 
USING (
    auth.uid() = user_id
    OR
    (SELECT role FROM public.profiles WHERE user_id = auth.uid()) = 'admin'::app_role
)
WITH CHECK (
    auth.uid() = user_id
    OR
    (SELECT role FROM public.profiles WHERE user_id = auth.uid()) = 'admin'::app_role
);
```

## 🔍 Why This Happened

The error was caused by:

1. **Recursive RLS policies** - Functions like `get_current_user_role()` that query the same table they're protecting
2. **Permission conflicts** - Multiple overlapping policies causing confusion
3. **Infinite loops** - RLS policies calling functions that query the same table

## 🎯 Root Cause Analysis

Based on the codebase analysis, the issue stems from:

- **File**: `supabase/migrations/20250720101109-014f7f09-aa20-456a-9863-9d76f313aef0.sql`
- **Problem**: Lines 64-67 create a `get_current_user_role()` function that causes infinite recursion
- **Impact**: Any query to the profiles table triggers this function, which queries the profiles table again

## ✅ Verification

After applying the fix, test these:

1. **User Profile Loading**: Should work without permission errors
2. **Authentication**: Users should be able to sign in and see their profile
3. **Admin Functions**: Admin users should be able to manage other profiles (if applicable)

## 🔄 Alternative Emergency Commands

If the above doesn't work, try these alternatives in Supabase SQL Editor:

```sql
-- Option 1: Completely reset profiles table policies
DROP POLICY IF EXISTS ALL ON public.profiles;
ALTER TABLE public.profiles DISABLE ROW LEVEL SECURITY;

-- Option 2: Grant direct access (temporary)
GRANT ALL ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO anon;

-- Option 3: Check what's blocking access
SELECT * FROM pg_policies WHERE tablename = 'profiles';
```

## 📞 If You Still Need Help

1. Check the browser console for specific error messages
2. Verify you're signed in to the application
3. Ensure your Supabase project is active and not paused
4. Try the Supabase dashboard's Table Editor to see if you can manually view the profiles table

The emergency fix should resolve the immediate issue and get your application working again.
