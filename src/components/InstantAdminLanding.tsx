import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { AdminSignIn } from '@/components/AdminSignIn';
import AdminDashboard from '@/pages/AdminDashboard';

export default function InstantAdminLanding() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [authChecked, setAuthChecked] = useState(false);

  useEffect(() => {
    checkAuthStatusInstantly();
    
    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      console.log('🔄 Admin auth state changed:', event);
      checkAuthStatusInstantly();
    });

    return () => subscription.unsubscribe();
  }, []);

  const checkAuthStatusInstantly = async () => {
    try {
      // Check for instant admin access first
      const adminEmail = 'support@backlinkoo.com';
      if (sessionStorage.getItem('instant_admin') === 'true') {
        setIsAuthenticated(true);
        setIsAdmin(true);
        setAuthChecked(true);
        return;
      }

      const { data: { user }, error } = await supabase.auth.getUser();

      if (error || !user) {
        setIsAuthenticated(false);
        setIsAdmin(false);
        setAuthChecked(true);
        return;
      }

      setIsAuthenticated(true);

      // Instant admin check for admin email
      if (user.email === adminEmail) {
        sessionStorage.setItem('instant_admin', 'true');
        setIsAdmin(true);
        setAuthChecked(true);
        return;
      }

      // For other emails, just show sign in form
      setIsAdmin(false);
      setAuthChecked(true);

    } catch (error) {
      console.error('Admin auth check failed:', error);
      setIsAuthenticated(false);
      setIsAdmin(false);
      setAuthChecked(true);
    }
  };

  // Don't render anything until auth is checked (prevents flash)
  if (!authChecked) {
    return null;
  }

  // If user is authenticated and is admin, show dashboard
  if (isAuthenticated && isAdmin) {
    return <AdminDashboard />;
  }

  // Otherwise, show sign in
  return <AdminSignIn />;
}
