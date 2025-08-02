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

      const { data: { user }, error } = await supabase.auth.getUser();

      if (error || !user) {
        setIsAuthenticated(false);
        setIsAdmin(false);
        setIsLoading(false);
        return;
      }

      setIsAuthenticated(true);

      // Check if user is admin
      try {
        const { data: profile } = await supabase
          .from('profiles')
          .select('role')
          .eq('user_id', user.id)
          .single();

        if (profile?.role === 'admin') {
          setIsAdmin(true);
        } else {
          setIsAdmin(false);
        }
      } catch (error) {
        console.warn('Could not check admin status:', error);
        setIsAdmin(false);
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
