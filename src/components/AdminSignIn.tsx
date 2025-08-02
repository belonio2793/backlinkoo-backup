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
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background to-muted/20">
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



            <div className="space-y-3">
              <Button
                type="submit"
                className="w-full h-11"
                disabled={loading}
              >
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Authenticating...
                  </>
                ) : (
                  <>
                    <Shield className="h-4 w-4 mr-2" />
                    Access Admin Dashboard
                  </>
                )}
              </Button>

              <Button
                type="button"
                variant="outline"
                className="w-full h-11"
                onClick={handleGoBack}
                disabled={loading}
              >
                ← Return to Main Site
              </Button>
            </div>
          </form>

          <div className="mt-6 pt-4 border-t text-center text-xs text-muted-foreground">
            <p>🔒 Secure admin authentication</p>
            <p>Need access? Contact the development team.</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
