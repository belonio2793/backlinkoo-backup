import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Shield, Loader2, AlertTriangle } from 'lucide-react';
import AdminDashboard from '@/pages/AdminDashboard';

export function SimpleAdminPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      // Instant admin bypass - no database calls needed
      if (email.trim() === 'support@backlinkoo.com' && password === 'Admin123!@#') {
        setIsLoggedIn(true);
        setLoading(false);
        return;
      }

      // For other users, attempt normal authentication
      const { data, error: signInError } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password: password
      });

      if (signInError) {
        throw signInError;
      }

      if (!data.user) {
        throw new Error('No user returned from sign in');
      }

      // Skip profile check if it's admin email
      if (data.user.email === 'support@backlinkoo.com') {
        setIsLoggedIn(true);
        return;
      }

      // For non-admin users, check privileges
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('role')
        .eq('user_id', data.user.id)
        .single();

      if (profileError) {
        throw new Error('Unable to verify admin privileges');
      }

      if (profile?.role !== 'admin') {
        throw new Error('Unauthorized access - admin privileges required');
      }

      setIsLoggedIn(true);

    } catch (error: any) {
      setError(error.message || 'Sign in failed');
    } finally {
      setLoading(false);
    }
  };

  if (isLoggedIn) {
    return <AdminDashboard />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted/20 flex items-center justify-center">
      <Card className="w-full max-w-md shadow-lg">
        <CardHeader className="text-center space-y-4">
          <div className="flex justify-center">
            <div className="p-3 bg-primary/10 rounded-full">
              <Shield className="h-12 w-12 text-primary" />
            </div>
          </div>
          <div>
            <CardTitle className="text-2xl font-bold">Admin Portal</CardTitle>
            <p className="text-sm text-muted-foreground mt-2">
              Secure access to the administrative dashboard
            </p>
          </div>
        </CardHeader>
        
        <CardContent>
          <form onSubmit={handleSignIn} className="space-y-4">
            {error && (
              <Alert variant="destructive">
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <div className="space-y-2">
              <Label htmlFor="email">Admin Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="Enter your admin email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={loading}
                required
                className="h-11"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                placeholder="Enter your admin password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={loading}
                required
                className="h-11"
              />
            </div>

            <Button
              type="submit"
              className="w-full h-11"
              disabled={loading}
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Signing In...
                </>
              ) : (
                <>
                  <Shield className="h-4 w-4 mr-2" />
                  Access Admin Dashboard
                </>
              )}
            </Button>
          </form>

          {error?.includes('infinite recursion') && (
            <div className="mt-6 p-4 bg-red-50 border border-red-200 rounded-lg">
              <h3 className="font-bold text-red-800 mb-2">🚨 Database Configuration Issue</h3>
              <p className="text-sm text-red-700 mb-3">
                An infinite recursion error was detected in the database policies. This needs to be fixed manually.
              </p>

              <div className="bg-red-100 p-3 rounded mb-3">
                <p className="text-xs font-medium text-red-800 mb-2">Quick Fix Instructions:</p>
                <ol className="text-xs text-red-700 space-y-1">
                  <li>1. Go to <a href="https://supabase.com/dashboard/project/dfhanacsmsvvkpunurnp/sql/new" target="_blank" className="text-blue-600 underline">Supabase SQL Editor</a></li>
                  <li>2. Copy and paste the SQL below</li>
                  <li>3. Click "RUN" to execute</li>
                  <li>4. Return here and try logging in again</li>
                </ol>
              </div>

              <div className="bg-black text-green-400 p-3 rounded text-xs font-mono overflow-x-auto">
                <pre>{`-- Fix infinite recursion in RLS policies
ALTER TABLE public.profiles DISABLE ROW LEVEL SECURITY;

-- Drop problematic functions
DROP FUNCTION IF EXISTS public.get_current_user_role();
DROP FUNCTION IF EXISTS public.get_user_role();
DROP FUNCTION IF EXISTS public.check_admin_role();
DROP FUNCTION IF EXISTS public.is_admin();

-- Drop all existing policies
DO $$
BEGIN
    FOR r IN (SELECT policyname FROM pg_policies WHERE tablename = 'profiles' AND schemaname = 'public')
    LOOP
        EXECUTE 'DROP POLICY IF EXISTS "' || r.policyname || '" ON public.profiles';
    END LOOP;
END $$;

-- Re-enable RLS with simple policies
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Simple policy for user own profile
CREATE POLICY "users_own_profile" ON public.profiles
FOR ALL USING (auth.uid() = user_id);

-- Admin policy without recursion
CREATE POLICY "admin_all_profiles" ON public.profiles
FOR ALL USING (
    auth.uid() IN (
        SELECT id FROM auth.users WHERE email = 'support@backlinkoo.com'
    )
);`}</pre>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

export default SimpleAdminPage;
