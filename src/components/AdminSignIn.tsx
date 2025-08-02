import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { SafeAuth } from '@/utils/safeAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Label } from '@/components/ui/label';
import { Loader2, Shield, AlertTriangle } from 'lucide-react';

export function AdminSignIn() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email || !password) {
      setError('Please enter both email and password');
      return;
    }

    try {
      setLoading(true);
      setError(null);

      console.log('🔐 Attempting admin sign in...');

      const result = await SafeAuth.signIn(email.trim(), password);

      if (!result.success) {
        setError(result.error || 'Sign in failed');
        return;
      }

      console.log('✅ User signed in:', result.user?.email);

      if (!result.isAdmin) {
        setError('This account does not have admin privileges. Please contact an administrator.');

        // Sign out the non-admin user
        await SafeAuth.signOut();
        return;
      }

      console.log('✅ Admin user verified');

      // Success! Reload the page to trigger the admin dashboard
      window.location.reload();

    } catch (error: any) {
      console.error('❌ Sign in failed:', error);
      setError('Sign in failed. Please check your credentials and try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleGoBack = () => {
    navigate('/');
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <Shield className="h-12 w-12 text-primary" />
          </div>
          <CardTitle className="text-2xl">Admin Sign In</CardTitle>
          <p className="text-sm text-muted-foreground">
            Administrator credentials required to access the admin dashboard
          </p>
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
                placeholder="admin@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={loading}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={loading}
                required
              />
            </div>

            <div className="space-y-2">
              <Button
                type="submit"
                className="w-full"
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
                    Sign In as Admin
                  </>
                )}
              </Button>
              
              <Button
                type="button"
                variant="outline"
                className="w-full"
                onClick={handleGoBack}
                disabled={loading}
              >
                Go Back to Main Site
              </Button>
            </div>
          </form>

          <div className="mt-6 text-center text-sm text-muted-foreground">
            <p>Don't have admin access?</p>
            <p>Contact your system administrator for access.</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
