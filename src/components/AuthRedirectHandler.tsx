import { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';

/**
 * Component that handles automatic redirects for authenticated users
 * If user is signed in and on login page, redirect to dashboard
 */
export const AuthRedirectHandler = ({ children }: { children: React.ReactNode }) => {
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const checkAuthAndRedirect = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        
        // If user is authenticated and on login page, redirect to redirect page
        if (session?.user && location.pathname === '/login') {
          console.log('🔐 User already authenticated, redirecting from login to redirect page');
          navigate('/redirect');
        }
      } catch (error) {
        console.error('Auth redirect check error:', error);
      }
    };

    checkAuthAndRedirect();

    // Listen for auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_IN' && session?.user && location.pathname === '/login') {
        console.log('🔐 User signed in, redirecting to dashboard');
        navigate('/dashboard');
      }
    });

    return () => {
      subscription?.unsubscribe();
    };
  }, [navigate, location.pathname]);

  return <>{children}</>;
};
