import { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { stripeWrapper } from '@/services/stripeWrapper';

/**
 * Component that handles automatic redirects for authenticated users
 * If user is signed in and on login page, redirect to dashboard
 */
export const AuthRedirectHandler = ({ children }: { children: React.ReactNode }) => {
  const navigate = useNavigate();
  const location = useLocation();

  // Automatically open Stripe checkout once per session after sign-in
  const tryAutoOpenCheckout = async () => {
    try {
      if (localStorage.getItem('auto_checkout_done') === '1') return;
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      localStorage.setItem('auto_checkout_done', '1');
      await stripeWrapper.quickBuyCredits(100, user.email || undefined);
    } catch (e) {
      console.warn('Auto-checkout open skipped:', e instanceof Error ? e.message : e);
    }
  };

  useEffect(() => {
    const checkAuthAndRedirect = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();

        if (session?.user) {
          // Attempt auto checkout when session exists (e.g., returning to /login while signed in)
          tryAutoOpenCheckout();
        }

        // If user is authenticated and on login page, check where to redirect
        if (session?.user && location.pathname === '/login') {
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
      if (event === 'SIGNED_IN' && session?.user) {
        // Open checkout automatically after sign-in
        tryAutoOpenCheckout();
      }

      if (event === 'SIGNED_IN' && session?.user && location.pathname === '/login') {
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

      if (event === 'SIGNED_OUT') {
        localStorage.removeItem('auto_checkout_done');
      }
    });

    return () => {
      subscription?.unsubscribe();
    };
  }, [navigate, location.pathname]);

  return <>{children}</>;
};
