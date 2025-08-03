import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { SafeAuth } from '@/utils/safeAuth';
import { AdminSignIn } from './AdminSignIn';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, AlertTriangle, CheckCircle } from 'lucide-react';

interface AuthCheckProps {
  children: React.ReactNode;
  requireAdmin?: boolean;
}

export function AuthCheck({ children, requireAdmin = false }: AuthCheckProps) {
  const [loading, setLoading] = useState(false); // Start with false for instant processing
  const [user, setUser] = useState<any>(null);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showSignIn, setShowSignIn] = useState(false);

  useEffect(() => {
    // Check if we have instant admin access
    const adminEmail = 'support@backlinkoo.com';
    const currentUrl = window.location.pathname;

    // For admin routes, provide immediate access if session storage indicates admin access
    if (currentUrl.includes('/admin') && sessionStorage.getItem('instant_admin') === 'true') {
      setUser({ email: adminEmail });
      setUserRole('admin');
      setLoading(false);
      setShowSignIn(false);
      return;
    }

    // For admin routes, check immediately without showing loading
    if (requireAdmin) {
      checkAuthInstantly();
    } else {
      checkAuth();
    }

    // Listen for auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      console.log('🔄 Auth state changed:', event, session?.user?.email);
      if (event === 'SIGNED_IN' || event === 'SIGNED_OUT') {
        // For admin email, provide instant access
        if (session?.user?.email === adminEmail) {
          sessionStorage.setItem('instant_admin', 'true');
          setUser(session.user);
          setUserRole('admin');
          setLoading(false);
          setShowSignIn(false);
          return;
        }

        // Use instant check for admin routes, regular check for others
        if (requireAdmin) {
          checkAuthInstantly();
        } else {
          checkAuth();
        }
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const checkAuthInstantly = async () => {
    try {
      // Don't set loading to true for instant processing
      setError(null);

      // Check if user is authenticated using SafeAuth
      const userResult = await SafeAuth.getCurrentUser();

      if (userResult.needsAuth || !userResult.user) {
        console.log('🔐 No auth session - showing sign in');
        setShowSignIn(true);
        return;
      }

      if (userResult.error) {
        console.error('❌ Auth error:', userResult.error);
        setError('Authentication failed. Please sign in.');
        setShowSignIn(true);
        return;
      }

      const user = userResult.user;
      setUser(user);
      console.log('✅ User authenticated:', user.email);

      // For admin routes, provide instant access to admin email
      if (user.email === 'support@backlinkoo.com') {
        sessionStorage.setItem('instant_admin', 'true');
        setUserRole('admin');
        setShowSignIn(false);
        console.log('✅ Instant admin access granted:', user.email);
        return;
      }

      // If admin is required, check user role using SafeAuth
      if (requireAdmin) {
        const adminResult = await SafeAuth.isAdmin();

        if (adminResult.needsAuth) {
          setError('Admin access required. Please sign in with an admin account.');
          setShowSignIn(true);
          return;
        }

        if (adminResult.error) {
          console.error('❌ Admin check failed:', adminResult.error);
          setError('Could not verify admin permissions.');
          return;
        }

        if (!adminResult.isAdmin) {
          setError('Admin access required. Please sign in with an admin account.');
          setShowSignIn(true);
          return;
        }

        setUserRole('admin');
        console.log('✅ Admin user verified:', user.email);
      }

      // Success - hide sign in form
      setShowSignIn(false);
      console.log('✅ Authentication successful');

    } catch (error: any) {
      console.error('❌ Auth check failed:', error);
      setError('Authentication check failed.');
      setShowSignIn(true);
    }
  };

  const checkAuth = async () => {
    try {
      setLoading(true);
      setError(null);

      // Check if user is authenticated using SafeAuth
      const userResult = await SafeAuth.getCurrentUser();

      if (userResult.needsAuth || !userResult.user) {
        console.log('🔐 No auth session - showing sign in');
        setShowSignIn(true);
        return;
      }

      if (userResult.error) {
        console.error('❌ Auth error:', userResult.error);
        setError('Authentication failed. Please sign in.');
        setShowSignIn(true);
        return;
      }

      const user = userResult.user;
      setUser(user);
      console.log('✅ User authenticated:', user.email);

      // If admin is required, check user role using SafeAuth
      if (requireAdmin) {
        const adminResult = await SafeAuth.isAdmin();

        if (adminResult.needsAuth) {
          setError('Admin access required. Please sign in with an admin account.');
          setShowSignIn(true);
          return;
        }

        if (adminResult.error) {
          console.error('❌ Admin check failed:', adminResult.error);
          setError('Could not verify admin permissions.');
          return;
        }

        if (!adminResult.isAdmin) {
          setError('Admin access required. Please sign in with an admin account.');
          setShowSignIn(true);
          return;
        }

        setUserRole('admin');
        console.log('✅ Admin user verified:', user.email);
      }

      // Success - hide sign in form
      setShowSignIn(false);
      console.log('✅ Authentication successful');

    } catch (error: any) {
      console.error('❌ Auth check failed:', error);
      setError('Authentication check failed.');
      setShowSignIn(true);
    } finally {
      setLoading(false);
    }
  };

  const handleRetry = () => {
    if (requireAdmin) {
      checkAuthInstantly();
    } else {
      checkAuth();
    }
  };

  const handleSignOut = async () => {
    try {
      await SafeAuth.signOut();
      setShowSignIn(true);
      setUser(null);
      setUserRole(null);
      setError(null);
    } catch (error) {
      console.error('Sign out error:', error);
    }
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

  if (showSignIn || (!user && requireAdmin)) {
    return <AdminSignIn />;
  }

  if (error && user && requireAdmin) {
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
                <Button onClick={handleRetry} className="w-full">
                  Retry
                </Button>
                
                <Button onClick={handleSignOut} variant="outline" className="w-full">
                  Sign Out & Try Different Account
                </Button>
              </div>

              <div className="text-center text-sm text-muted-foreground">
                <p>Signed in as: {user.email}</p>
                {userRole && <p>Role: {userRole}</p>}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Render children directly for admin users
  if (user && requireAdmin && userRole === 'admin') {
    return <>{children}</>;
  }

  return <>{children}</>;
}
