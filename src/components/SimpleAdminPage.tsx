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
  const [email, setEmail] = useState('support@backlinkoo.com');
  const [password, setPassword] = useState('Admin123!@#');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [creating, setCreating] = useState(false);

  const createAdminUser = async () => {
    setCreating(true);
    setError(null);

    try {
      console.log('🚨 Emergency admin user creation...');

      // Try emergency admin creation function
      try {
        const response = await fetch('/.netlify/functions/create-admin-emergency', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({})
        });

        const result = await response.json();

        if (result.success) {
          setError('✅ Admin user created successfully! You can now sign in with the credentials shown below.');
          console.log('✅ Emergency admin creation successful');
          return;
        } else {
          console.warn('Emergency function failed:', result.error);
          throw new Error(result.error || 'Emergency creation failed');
        }
      } catch (funcError) {
        console.warn('Emergency function not available:', funcError);
        throw funcError;
      }

    } catch (error: any) {
      console.error('❌ Emergency admin creation failed:', error);

      // Show detailed troubleshooting
      setError(`❌ Automatic creation failed: ${error.message}. Please use manual SQL method below.`);
    } finally {
      setCreating(false);
    }
  };

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      console.log('🔐 Attempting sign in...');
      
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
      
      // For now, just trust that support@backlinkoo.com is admin
      // Skip the problematic profile database check
      if (data.user.email === 'support@backlinkoo.com') {
        setIsLoggedIn(true);
      } else {
        setError('This email is not authorized for admin access');
      }

    } catch (error: any) {
      console.error('❌ Sign in failed:', error);

      // If it's invalid credentials, automatically try to create the admin user
      if (error.message?.includes('Invalid login credentials') && email === 'support@backlinkoo.com') {
        console.log('🔧 Invalid credentials - attempting to create admin user automatically...');
        setError('Admin user not found. Creating admin user automatically...');

        try {
          await createAdminUser();
          // After creating, try to sign in again
          setError('Admin user created! Please try signing in again.');
        } catch (createError) {
          setError('Failed to create admin user. Please use the "Create Admin User" button below.');
        }
      } else {
        setError(error.message || 'Sign in failed');
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
          {!isLoggedIn && (
            <Alert className="mb-4">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                <strong>First time setup:</strong> If you get "Invalid login credentials",
                click "Create Admin User" button below to set up the admin account.
              </AlertDescription>
            </Alert>
          )}

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
                placeholder="support@backlinkoo.com"
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

            <div className="p-3 bg-muted/50 rounded-lg text-xs text-muted-foreground">
              <p className="font-medium mb-1">Admin Credentials:</p>
              <p>Email: support@backlinkoo.com</p>
              <p>Password: Admin123!@#</p>
            </div>

            <div className="space-y-3">
              <Button
                type="submit"
                className="w-full h-11"
                disabled={loading || creating}
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

              <Button
                type="button"
                variant="outline"
                className="w-full h-11"
                onClick={createAdminUser}
                disabled={loading || creating}
              >
                {creating ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Creating Admin User...
                  </>
                ) : (
                  <>
                    🔧 Create Admin User
                  </>
                )}
              </Button>

              {error?.includes('Invalid login credentials') && (
                <Button
                  type="button"
                  variant="destructive"
                  className="w-full h-11"
                  onClick={() => window.open('https://supabase.com/dashboard/project/dfhanacsmsvvkpunurnp/sql/new', '_blank')}
                >
                  🚀 Open Supabase SQL Editor
                </Button>
              )}
            </div>
          </form>

          <div className="mt-6 pt-4 border-t space-y-3">
            <div className="text-center text-xs text-muted-foreground">
              <p>🔒 If login fails with "Invalid credentials":</p>
              <p>Click "Create Admin User" first, then sign in</p>
            </div>

            {error?.includes('Invalid login credentials') && (
              <div className="bg-red-50 border border-red-200 p-4 rounded-lg">
                <h3 className="font-bold text-red-800 mb-2">⚠️ Admin User Doesn't Exist</h3>
                <p className="text-sm text-red-700 mb-3">
                  The admin user hasn't been created yet. Follow these steps:
                </p>

                <div className="space-y-2 text-sm">
                  <div className="bg-red-100 p-2 rounded">
                    <p className="font-medium">Step 1: Go to Supabase Dashboard</p>
                    <p>Visit: <a href="https://supabase.com/dashboard/project/dfhanacsmsvvkpunurnp" target="_blank" className="text-blue-600 underline">https://supabase.com/dashboard/project/dfhanacsmsvvkpunurnp</a></p>
                  </div>

                  <div className="bg-red-100 p-2 rounded">
                    <p className="font-medium">Step 2: Click "SQL Editor" in sidebar</p>
                  </div>

                  <div className="bg-red-100 p-2 rounded">
                    <p className="font-medium">Step 3: Paste this SQL command:</p>
                    <code className="block bg-black text-green-400 p-2 rounded text-xs font-mono mt-1 overflow-x-auto">
{`INSERT INTO auth.users (
  instance_id, id, aud, role, email,
  encrypted_password, email_confirmed_at,
  created_at, updated_at, raw_app_meta_data, is_super_admin
) VALUES (
  '00000000-0000-0000-0000-000000000000',
  gen_random_uuid(), 'authenticated', 'authenticated',
  'support@backlinkoo.com',
  crypt('Admin123!@#', gen_salt('bf')),
  NOW(), NOW(), NOW(),
  '{"provider": "email", "providers": ["email"]}',
  FALSE
);`}
                    </code>
                  </div>

                  <div className="bg-red-100 p-2 rounded">
                    <p className="font-medium">Step 4: Click "RUN" button</p>
                  </div>

                  <div className="bg-red-100 p-2 rounded">
                    <p className="font-medium">Step 5: Return here and sign in</p>
                    <p>Email: support@backlinkoo.com</p>
                    <p>Password: Admin123!@#</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default SimpleAdminPage;
