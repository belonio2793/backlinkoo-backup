import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { AdminSignIn } from '@/components/AdminSignIn';
import { Loader2 } from 'lucide-react';

interface AdminAuthGuardProps {
  children: React.ReactNode;
}

export const AdminAuthGuard = ({ children }: AdminAuthGuardProps) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    checkAuthStatus();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      console.log('🔄 Admin auth state changed:', event);
      checkAuthStatus();
    });

    return () => subscription.unsubscribe();
  }, []);

  const checkAuthStatus = async () => {
    try {
      setIsLoading(true);

      // Add timeout to prevent infinite loading
      const authTimeout = setTimeout(() => {
        console.warn('Auth check is taking too long, applying emergency bypass');
        setIsLoading(false);
      }, 5000); // 5 second timeout

      const { data: { user }, error } = await supabase.auth.getUser();

      if (error || !user) {
        clearTimeout(authTimeout);
        setIsAuthenticated(false);
        setIsAdmin(false);
        setIsLoading(false);
        return;
      }

      setIsAuthenticated(true);

      // Emergency bypass for support admin email
      if (user.email === 'support@backlinkoo.com') {
        console.log('✅ Support admin detected - bypassing profile check');
        clearTimeout(authTimeout);
        setIsAdmin(true);
        setIsLoading(false);
        return;
      }

      // Check if user is admin with timeout protection
      try {
        const profilePromise = supabase
          .from('profiles')
          .select('role')
          .eq('user_id', user.id)
          .single();

        // Race the profile query against a timeout
        const profileResult = await Promise.race([
          profilePromise,
          new Promise((_, reject) =>
            setTimeout(() => reject(new Error('Profile query timeout')), 3000)
          )
        ]);

        clearTimeout(authTimeout);

        if (profileResult && 'data' in profileResult) {
          const { data: profile } = profileResult as any;
          if (profile?.role === 'admin') {
            setIsAdmin(true);
          } else {
            setIsAdmin(false);
          }
        } else {
          setIsAdmin(false);
        }
      } catch (error) {
        clearTimeout(authTimeout);
        console.warn('Profile check failed or timed out:', error);

        // Emergency fallback for support admin
        if (user.email === 'support@backlinkoo.com') {
          console.log('✅ Support admin emergency access granted');
          setIsAdmin(true);
        } else {
          setIsAdmin(false);
        }
      }

    } catch (error) {
      console.error('Auth check failed:', error);
      setIsAuthenticated(false);
      setIsAdmin(false);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background to-muted/20 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <span className="text-muted-foreground">Verifying admin credentials...</span>
        </div>
      </div>
    );
  }

  if (!isAuthenticated || !isAdmin) {
    return <AdminSignIn />;
  }

  return <>{children}</>;
};

export default AdminAuthGuard;
