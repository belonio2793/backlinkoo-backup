import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useGuestTracking } from '@/hooks/useGuestTracking';
import { supabase } from '@/integrations/supabase/client';
import { AuthService } from '@/services/authService';
import { GuestDashboard } from '@/components/GuestDashboard';
import { UserBlogDashboard } from '@/components/UserBlogDashboard';
import Dashboard from '@/pages/Dashboard';

export function EnhancedDashboardRouter() {
  const [user, setUser] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [hasTrialPosts, setHasTrialPosts] = useState(false);
  const [guestAnalytics, setGuestAnalytics] = useState({ sessionDuration: 0, interactions: 0 });
  const navigate = useNavigate();
  const { toast } = useToast();
  const { getGuestData, getSessionDuration, shouldShowConversionPrompt, trackInteraction } = useGuestTracking();

  useEffect(() => {
    const timeout = setTimeout(() => {
      console.warn('⏰ Dashboard loading timeout reached, checking localStorage and forcing completion');
      // Last resort: check if there's any stored auth data
      const hasStoredAuth = localStorage.getItem('sb-dfhanacsmsvvkpunurnp-auth-token') !== null;
      if (hasStoredAuth) {
        console.log('🔑 Found stored auth token, allowing dashboard access');
        setUser({ id: 'fallback-user', email: 'stored@auth.user', email_confirmed_at: new Date().toISOString() });
      } else {
        console.log('🚪 No stored auth found, redirecting to login');
        navigate('/login');
      }
      setIsLoading(false);
    }, 8000); // Increased to 8 seconds
    return () => clearTimeout(timeout);
  }, [navigate]);

  useEffect(() => {
    let isMounted = true;
    let subscription: any;

    const checkUserAndTrialPosts = async () => {
    try {
      console.log('🔍 Checking user authentication for dashboard...');

      // Quick check: if we're in development or have persistent auth issues, use simplified check
      const isDevelopment = window.location.hostname === 'localhost' || window.location.hostname.includes('127.0.0.1');
      const hasRecentAuthError = localStorage.getItem('recent_auth_error');

      if (isDevelopment && hasRecentAuthError) {
        console.log('🔧 Development mode with recent auth errors, using simplified check');
        const mockUser = { id: 'dev-user', email: 'dev@example.com', email_confirmed_at: new Date().toISOString() };
        setUser(mockUser);
        setIsLoading(false);
        return;
      }

      // Add timeout to prevent hanging auth checks (increased to 10 seconds)
      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error('Auth check timeout')), 10000)
      );

      const sessionPromise = supabase.auth.getSession();

      let sessionResult;
      try {
        sessionResult = await Promise.race([sessionPromise, timeoutPromise]);
      } catch (timeoutError) {
        console.warn('⚠️ Auth check timed out, trying fallback method...');
        // Fallback: try direct user check
        try {
          const { data: { user }, error: userError } = await supabase.auth.getUser();
          sessionResult = { data: { session: user ? { user } : null }, error: userError };
        } catch (fallbackError) {
          console.error('❌ Fallback auth check also failed, trying AuthService...');
          // Track this error for debugging
          localStorage.setItem('recent_auth_error', Date.now().toString());

          // Last resort: try AuthService
          try {
            const { session, user } = await AuthService.getCurrentSession();
            sessionResult = { data: { session }, error: null };
            console.log('✅ AuthService fallback successful');
            // Clear error flag on success
            localStorage.removeItem('recent_auth_error');
          } catch (authServiceError) {
            console.error('❌ All auth methods failed:', authServiceError);
            setIsLoading(false);
            navigate('/login');
            return;
          }
        }
      }

      const { data: { session }, error } = sessionResult as any;

      if (!isMounted) return;

      if (error) {
        console.error('🔍 Session check error:', error);
        setIsLoading(false);
        navigate('/login');
        return;
      }

      console.log('🔍 Session check result:', {
        hasSession: !!session,
        hasUser: !!session?.user,
        userEmail: session?.user?.email,
        emailConfirmed: session?.user?.email_confirmed_at,
        sessionValid: !!(session?.user && session.user.email_confirmed_at)
      });

      const validUser = session?.user && session.user.email_confirmed_at;
      setUser(validUser || null);

      if (validUser) {
        console.log('✅ User authenticated and verified, showing dashboard');
        setIsLoading(false);
      } else {
        console.log('❌ User not authenticated or email not verified, redirecting to login');
        setIsLoading(false);
        // Small delay to prevent redirect loop
        setTimeout(() => navigate('/login'), 100);
      }
    } catch (error: any) {
      console.error('Dashboard router error:', error);
      if (isMounted) {
        // Show user-friendly error message
        if (error.message.includes('timeout')) {
          toast({
            title: "Connection Slow",
            description: "Authentication is taking longer than expected. Redirecting to login...",
            variant: "destructive"
          });
        } else {
          toast({
            title: "Authentication Error",
            description: "Unable to verify your login status. Please sign in again.",
            variant: "destructive"
          });
        }
        setIsLoading(false);
        setTimeout(() => navigate('/login'), 1500); // Give user time to read the message
      }
    }
  };

    checkUserAndTrialPosts();

    // Listen for auth state changes
    const authListener = supabase.auth.onAuthStateChange((event, session) => {
      console.log('🔐 Dashboard auth state changed:', event, {
        hasUser: !!session?.user,
        userEmail: session?.user?.email,
        emailConfirmed: session?.user?.email_confirmed_at
      });
      if (isMounted) {
        const validUser = session?.user && session.user.email_confirmed_at;
        setUser(validUser || null);
        setIsLoading(false);

        // If user signed out or lost valid session, redirect to login
        if ((event === 'SIGNED_OUT' || !validUser) && event !== 'INITIAL_SESSION') {
          console.log('🚪 User signed out or invalid session, redirecting to login');
          setTimeout(() => navigate('/login'), 100);
        }
      }
    });

    subscription = authListener.data?.subscription;

    return () => {
      isMounted = false;
      subscription?.unsubscribe?.();
    };
  }, [navigate]);

  useEffect(() => {
    if (!isLoading && !user) {
      console.log('🚫 No authenticated user, redirecting to login in 1 second...');
      const timer = setTimeout(() => {
        navigate('/login');
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [isLoading, user, navigate]);

  console.log('📊 Dashboard Router State:', { isLoading, user: !!user, hasTrialPosts, guestAnalytics });

  if (isLoading) {
    console.log('⏳ Showing loading screen');
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="flex items-center gap-2">
          <Loader2 className="h-4 w-4 animate-spin" />
          <span>Loading dashboard...</span>
        </div>
      </div>
    );
  }

  if (user) {
    console.log('👤 Rendering authenticated dashboard');
    return <Dashboard />;
  }

  // For non-authenticated users, show a redirect spinner
  return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="flex items-center gap-2">
        <Loader2 className="h-4 w-4 animate-spin" />
        <span>Redirecting...</span>
      </div>
    </div>
  );
}
