import React, { useState, useEffect } from 'react';
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

      // Check if user is admin by email or profile
      try {
        // Check by email first (common admin emails)
        const adminEmails = ['admin@backlinkoo.com', 'support@backlinkoo.com'];
        const isAdminByEmail = adminEmails.includes(user.email || '');

        if (isAdminByEmail) {
          clearTimeout(timeoutId);
          setIsAdmin(true);
          setLoading(false);
          return;
        }

        // Check profile role
        const { data: profile } = await supabase
          .from('profiles')
          .select('role')
          .eq('user_id', user.id)
          .single();

        const isAdminByRole = profile?.role === 'admin';

        clearTimeout(timeoutId);
        setIsAdmin(isAdminByRole);
        setLoading(false);

      } catch (profileError) {
        console.warn('Profile check failed, using email-based admin check:', profileError);
        // Fallback to email-based admin check
        const adminEmails = ['admin@backlinkoo.com', 'support@backlinkoo.com'];
        const isAdminByEmail = adminEmails.includes(user.email || '');

        clearTimeout(timeoutId);
        setIsAdmin(isAdminByEmail);
        setLoading(false);
      }

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
