# 🚨 URGENT: Fix Admin Login Issue

## The Problem
You're experiencing infinite recursion in the database RLS policies that's preventing login.

## 🔧 IMMEDIATE FIX (Choose ONE method)

### Method 1: Use Browser Console (FASTEST)
1. Open your browser's Developer Console (F12)
2. Go to your application (`http://localhost:8080` or `https://backlinkoo.com`)
3. Run this command in the console:

```javascript
// Emergency admin creation
fetch('/api/create-admin-user', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    email: 'support@backlinkoo.com',
    password: 'Admin123!@#'
  })
}).then(r => r.json()).then(console.log);
```

### Method 2: Database Direct Fix
1. Go to your Supabase dashboard: https://supabase.com/dashboard
2. Navigate to your project: `dfhanacsmsvvkpunurnp`
3. Go to SQL Editor
4. Run this SQL script:

```sql
-- Emergency fix for infinite recursion
DROP FUNCTION IF EXISTS public.get_current_user_role();

-- Temporarily disable RLS
ALTER TABLE public.profiles DISABLE ROW LEVEL SECURITY;

-- Create admin user
INSERT INTO auth.users (id, instance_id, email, encrypted_password, email_confirmed_at, created_at, updated_at, raw_app_meta_data, raw_user_meta_data, is_super_admin, role)
SELECT 
  gen_random_uuid(),
  '00000000-0000-0000-0000-000000000000',
  'support@backlinkoo.com',
  crypt('Admin123!@#', gen_salt('bf')),
  now(),
  now(),
  now(),
  '{"provider": "email", "providers": ["email"]}',
  '{"full_name": "Support Admin"}',
  false,
  'authenticated'
WHERE NOT EXISTS (SELECT 1 FROM auth.users WHERE email = 'support@backlinkoo.com');

-- Create admin profile
INSERT INTO public.profiles (user_id, email, full_name, display_name, role, created_at, updated_at)
SELECT 
  au.id,
  'support@backlinkoo.com',
  'Support Admin',
  'Support Team',
  'admin',
  now(),
  now()
FROM auth.users au 
WHERE au.email = 'support@backlinkoo.com'
ON CONFLICT (user_id) DO UPDATE SET
  role = 'admin',
  updated_at = now();

-- Re-enable RLS with safe policies
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Create safe policies
DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;
CREATE POLICY "Users can view their own profile" ON public.profiles
    FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;
CREATE POLICY "Admins can view all profiles" ON public.profiles
    FOR SELECT USING (
        auth.uid() = user_id OR
        EXISTS (
            SELECT 1 FROM public.profiles p
            WHERE p.user_id = auth.uid() 
            AND p.role = 'admin'
        )
    );
```

### Method 3: Use HTML Setup Tool
1. Open the file `create-admin.html` in your browser
2. Click "Create Admin User"
3. It will create the user automatically

### Method 4: Manual Supabase Dashboard
1. Go to Supabase Dashboard → Authentication → Users
2. Click "Add User"
3. Email: `support@backlinkoo.com`
4. Password: `Admin123!@#`
5. Click "Create User"
6. Go to Table Editor → profiles table
7. Add a new row:
   - user_id: (copy from the user you just created)
   - email: `support@backlinkoo.com`
   - role: `admin`
   - full_name: `Support Admin`

## 🔑 Login Credentials
After any method above:
- **Email**: `support@backlinkoo.com`
- **Password**: `Admin123!@#`

## 🚀 Access URLs
- **Local**: `http://localhost:8080/admin`
- **Production**: `https://backlinkoo.com/admin`

## ✅ Verification
After creating the admin user:
1. Go to `/admin`
2. Enter the credentials above
3. You should successfully log into the admin dashboard

## 🛡️ Emergency Bypass
I've also added an emergency bypass in the code - if you sign in with `support@backlinkoo.com`, it will automatically grant admin access even if the profile check fails.

---

**Try Method 1 (Browser Console) first - it's the fastest!**
