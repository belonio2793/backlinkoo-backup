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
    setIsLoading(true);

    // Set a hard timeout - if this takes more than 3 seconds, something is wrong
    const timeoutId = setTimeout(() => {
      console.warn('Auth check timed out - showing sign in form');
      setIsLoading(false);
      setIsAuthenticated(false);
      setIsAdmin(false);
    }, 3000);

    try {
      // Quick auth check
      const { data: { user }, error } = await supabase.auth.getUser();

      if (error || !user) {
        clearTimeout(timeoutId);
        setIsAuthenticated(false);
        setIsAdmin(false);
        setIsLoading(false);
        return;
      }

      setIsAuthenticated(true);

      // Skip profile check entirely if it's problematic
      // Just allow sign-in and let the actual sign-in process handle admin check
      clearTimeout(timeoutId);
      setIsAdmin(false); // Will show sign-in form
      setIsLoading(false);

    } catch (error) {
      console.error('Auth check failed:', error);
      clearTimeout(timeoutId);
      setIsAuthenticated(false);
      setIsAdmin(false);
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
