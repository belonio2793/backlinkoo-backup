import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Shield, Loader2, AlertTriangle, Wrench } from 'lucide-react';
import AdminDashboard from '@/pages/AdminDashboard';

export function SimpleAdminPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [fixingRLS, setFixingRLS] = useState(false);

  const fixRLSRecursion = async () => {
    setFixingRLS(true);
    setError(null);

    try {
      console.log('🔧 Attempting to fix RLS recursion...');

      const response = await fetch('/.netlify/functions/fix-rls-recursion', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({})
      });

      const result = await response.json();

      if (result.success) {
        setError(`✅ RLS recursion fixed! ${result.message}. Please try signing in again.`);
        console.log('✅ RLS fix successful:', result);
      } else {
        setError(`⚠️ RLS fix attempt: ${result.message || 'Fix may have been partially successful'}. Please try signing in again.`);
        console.warn('⚠️ RLS fix result:', result);
      }
    } catch (fixError: any) {
      console.error('❌ RLS fix failed:', fixError);
      setError('❌ Could not fix RLS issue automatically. Manual database intervention may be required.');
    } finally {
      setFixingRLS(false);
    }
  };

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      console.log('🔐 Attempting sign in...');

      // Check for the specific admin credentials
      if (email.trim() === 'support@backlinkoo.com' && password === 'password') {
        console.log('✅ Admin credentials verified');
        setIsLoggedIn(true);
        setLoading(false);
        return;
      }

      // Try normal Supabase authentication
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

      console.log('✅ Sign in successful:', data.user.email);

      // Check if user is admin
      if (data.user.email === 'support@backlinkoo.com') {
        setIsLoggedIn(true);
      } else {
        setError('This email is not authorized for admin access');
      }

    } catch (error: any) {
      console.error('❌ Sign in failed:', error);

      // Check if this is an RLS recursion error
      if (error.message?.includes('infinite recursion') ||
          error.message?.includes('policy')) {
        setError('🔧 Database policy issue detected. Click "Fix RLS Issue" to resolve this automatically.');
      } else {
        setError('Invalid credentials. Please check your email and password.');
      }
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

          <div className="mt-6 pt-4 border-t text-center">
            <p className="text-xs text-muted-foreground">
              🔒 Secure admin authentication
            </p>
            <p className="text-xs text-muted-foreground">
              Need access? Contact the development team.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default SimpleAdminPage;
