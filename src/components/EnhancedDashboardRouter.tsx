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
    let subscription: any;

    const checkUserAndTrialPosts = async () => {
      try {
        console.log('🔍 Checking user authentication for dashboard...');
        const { data: { session } } = await supabase.auth.getSession();
        console.log('🔍 Session check result:', !!session?.user, session?.user?.email);

        if (!isMounted) return;

        setUser(session?.user || null);

        if (session?.user) {
          console.log('✅ User authenticated, showing dashboard');
          setIsLoading(false);
        } else {
          console.log('❌ User not authenticated, redirecting to login');
          navigate('/login');
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

    // Listen for auth state changes
    const authListener = supabase.auth.onAuthStateChange((event, session) => {
      console.log('🔐 Dashboard auth state changed:', event, !!session?.user);
      if (isMounted) {
        setUser(session?.user || null);
        setIsLoading(false);
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
