import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, AlertTriangle, UserX } from 'lucide-react';

interface AuthCheckProps {
  children: React.ReactNode;
  requireAdmin?: boolean;
}

export function AuthCheck({ children, requireAdmin = false }: AuthCheckProps) {
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      setLoading(true);
      setError(null);

      // Check if user is authenticated
      const { data: { user }, error: authError } = await supabase.auth.getUser();

      if (authError) {
        console.error('❌ Auth error:', authError);
        setError('Authentication failed. Please sign in.');
        return;
      }

      if (!user) {
        console.warn('⚠️ No authenticated user');
        setError('Please sign in to continue.');
        return;
      }

      setUser(user);

      // If admin is required, check user role
      if (requireAdmin) {
        try {
          const { data: profile, error: profileError } = await supabase
            .from('profiles')
            .select('role, email, display_name')
            .eq('user_id', user.id)
            .single();

          if (profileError) {
            console.error('❌ Profile fetch error:', profileError);
            setError('Could not verify admin permissions. Please contact support.');
            return;
          }

          if (!profile) {
            setError('No profile found. Please contact support.');
            return;
          }

          setUserRole(profile.role);

          if (profile.role !== 'admin') {
            setError('Admin access required. Please contact an administrator.');
            return;
          }

          console.log('✅ Admin user verified:', profile.email);
        } catch (error: any) {
          console.error('❌ Admin check failed:', error);
          setError('Could not verify admin permissions.');
          return;
        }
      }

      console.log('✅ Authentication successful');
    } catch (error: any) {
      console.error('❌ Auth check failed:', error);
      setError('Authentication check failed.');
    } finally {
      setLoading(false);
    }
  };

  const handleSignIn = () => {
    navigate('/');
  };

  const handleRetry = () => {
    checkAuth();
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6">
            <div className="flex flex-col items-center space-y-4">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              <div className="text-center">
                <h3 className="text-lg font-medium">Checking Authentication</h3>
                <p className="text-sm text-muted-foreground">
                  Verifying your access permissions...
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6">
            <div className="space-y-4">
              <Alert variant="destructive">
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>

              <div className="space-y-2">
                {!user && (
                  <Button onClick={handleSignIn} className="w-full">
                    Go to Sign In
                  </Button>
                )}
                
                <Button onClick={handleRetry} variant="outline" className="w-full">
                  Retry
                </Button>
              </div>

              {user && requireAdmin && (
                <div className="text-center text-sm text-muted-foreground">
                  <p>Signed in as: {user.email}</p>
                  {userRole && <p>Role: {userRole}</p>}
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return <>{children}</>;
}
