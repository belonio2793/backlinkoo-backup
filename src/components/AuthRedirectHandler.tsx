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

        // If user is authenticated and on login page, check where to redirect
        if (session?.user && location.pathname === '/login') {
          // Check if user was trying to access domains page
          const intendedRoute = localStorage.getItem('intended_route');
          if (intendedRoute === '/domains') {
            console.log('🔐 User already authenticated, redirecting to domains page');
            localStorage.removeItem('intended_route');
            navigate('/domains');
          } else {
            console.log('🔐 User already authenticated, redirecting from login to dashboard');
            navigate('/dashboard');
          }
        }
      } catch (error) {
        console.error('Auth redirect check error:', error);
      }
    };

    checkAuthAndRedirect();

    // Listen for auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_IN' && session?.user && location.pathname === '/login') {
        // Check if user was trying to access domains page
        const intendedRoute = localStorage.getItem('intended_route');
        if (intendedRoute === '/domains') {
          console.log('🔐 User signed in, redirecting to domains page');
          localStorage.removeItem('intended_route');
          navigate('/domains');
        } else {
          console.log('🔐 User signed in, redirecting to dashboard');
          navigate('/dashboard');
        }
      }
    });

    return () => {
      subscription?.unsubscribe();
    };
  }, [navigate, location.pathname]);

  return <>{children}</>;
};
