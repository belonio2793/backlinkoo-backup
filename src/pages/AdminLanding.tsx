import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { AdminSignIn } from '@/components/AdminSignIn';
import AdminDashboard from './AdminDashboard';
import { Card, CardContent } from '@/components/ui/card';
import { Loader2 } from 'lucide-react';

export default function AdminLanding() {
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    checkAuthStatus();
    
    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      console.log('🔄 Auth state changed:', event);
      checkAuthStatus();
    });

    return () => subscription.unsubscribe();
  }, []);

  const checkAuthStatus = async () => {
    setLoading(true);

    // Set aggressive timeout
    const timeoutId = setTimeout(() => {
      console.warn('Auth check timed out - showing sign in');
      setLoading(false);
      setIsAuthenticated(false);
      setIsAdmin(false);
    }, 2000); // Only 2 seconds

    try {
      const { data: { user }, error } = await supabase.auth.getUser();

      if (error || !user) {
        clearTimeout(timeoutId);
        setIsAuthenticated(false);
        setIsAdmin(false);
        setLoading(false);
        return;
      }

      setIsAuthenticated(true);

      // Skip the problematic profile check for now
      // Just show the sign-in form and let the sign-in process handle admin verification
      clearTimeout(timeoutId);
      setIsAdmin(false);
      setLoading(false);

    } catch (error) {
      console.error('Auth check failed:', error);
      clearTimeout(timeoutId);
      setIsAuthenticated(false);
      setIsAdmin(false);
      setLoading(false);
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
                <h3 className="text-lg font-medium">Loading Admin Dashboard</h3>
                <p className="text-sm text-muted-foreground">
                  Checking authentication status...
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // If user is authenticated and is admin, show dashboard
  if (isAuthenticated && isAdmin) {
    return <AdminDashboard />;
  }

  // Otherwise, show sign in
  return <AdminSignIn />;
}
