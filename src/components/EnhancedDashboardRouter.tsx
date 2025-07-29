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
      console.warn('⏰ Dashboard loading timeout reached, forcing load completion');
      setIsLoading(false);
    }, 5000);
    return () => clearTimeout(timeout);
  }, []);

  useEffect(() => {
    let isMounted = true;

    const checkUserAndTrialPosts = async () => {
      try {
        console.log('🔍 Checking user authentication...');
        const { data: { session } } = await supabase.auth.getSession();
        console.log('🔍 Session check result:', !!session?.user);

        if (!isMounted) return;

        setUser(session?.user || null);

        if (session?.user) {
          console.log('✅ User authenticated, showing dashboard');
          setIsLoading(false);
          return;
        } else {
          console.log('❌ User not authenticated, redirecting to login');
          navigate('/login');
          return;
        }
      } catch (error: any) {
        console.error('Dashboard router error:', error);
        if (isMounted) {
          setIsLoading(false);
          navigate('/login');
        }
      }
    };

    checkUserAndTrialPosts();
    return () => {
      isMounted = false;
    };
  }, [navigate]);

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      console.log('🔐 EnhancedDashboardRouter: Auth state changed:', event, !!session?.user);
      if (event === 'SIGNED_IN' && session?.user) {
        setUser(session.user);
        setIsLoading(false);
      } else if (event === 'SIGNED_OUT') {
        setUser(null);
      }
    });

    return () => {
      subscription?.unsubscribe();
    };
  }, []);

  useEffect(() => {
    if (!isLoading && !user) {
      console.log('🚫 Fallback redirect to login');
      navigate('/login');
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

  console.log('🚫 No authenticated user in fallback - redirecting');
  return null;
}
