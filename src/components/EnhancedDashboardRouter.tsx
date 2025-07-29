import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { GuestDashboard } from './GuestDashboard';
import Dashboard from '../pages/Dashboard';
import { GuestSessionReminder } from './GuestSessionReminder';
import { QuickTrialUpgrade } from './QuickTrialUpgrade';
import { TrialConversionService } from '@/services/trialConversionService';
import { useGuestTracking } from '@/hooks/useGuestTracking';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Loader2, User, ArrowRight, Sparkles, Crown, Clock } from 'lucide-react';

export function EnhancedDashboardRouter() {
  const [user, setUser] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [hasTrialPosts, setHasTrialPosts] = useState(false);
  const [guestAnalytics, setGuestAnalytics] = useState({ sessionDuration: 0, interactions: 0 });
  const navigate = useNavigate();
  const { getGuestData, getSessionDuration, shouldShowConversionPrompt, trackInteraction } = useGuestTracking();

  // Failsafe timeout to prevent infinite loading
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

        // Check authentication
        const { data: { session } } = await supabase.auth.getSession();
        console.log('🔍 Session check result:', !!session?.user);

        if (!isMounted) return;

        setUser(session?.user || null);

        // Set loading to false regardless of auth state to show dashboard
        console.log('✅ Setting loading to false, will show dashboard');
        setIsLoading(false);
      } catch (error) {
        console.error('Dashboard router error:', error);
        if (isMounted) {
          // Default to showing guest dashboard on error
          setIsLoading(false);
        }
      }
    };

    checkUserAndTrialPosts();

    return () => {
      isMounted = false;
    };
  }, [navigate]);

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

  // If user is authenticated, show protected dashboard
  if (user) {
    console.log('👤 Rendering authenticated dashboard');
    return <Dashboard />;
  }

  // For non-authenticated users, show loading while redirect happens
  return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="flex items-center gap-2">
        <Loader2 className="h-4 w-4 animate-spin" />
        <span>Redirecting...</span>
      </div>
    </div>
  );
}

// Guest Onboarding Dashboard Component
function GuestOnboardingDashboard({ 
  sessionDuration, 
  interactions, 
  onSignUp, 
  onCreateTrial 
}: {
  sessionDuration: number;
  interactions: number;
  onSignUp: () => void;
  onCreateTrial: () => void;
}) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <Badge className="mb-4 bg-blue-100 text-blue-800">
            Welcome Back! You've been exploring for {sessionDuration} minutes
          </Badge>
          <h1 className="text-4xl font-light mb-4 tracking-tight">
            Ready to Get Started?
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            You've explored our platform with {interactions} interactions. Create an account or try our free blog generator to see what we can do for your SEO.
          </p>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
          <Card className="p-8 text-center border-l-4 border-l-blue-500 hover:shadow-lg transition-shadow">
            <CardHeader className="pb-4">
              <div className="mx-auto mb-4 p-3 bg-blue-100 rounded-full w-fit">
                <User className="h-8 w-8 text-blue-600" />
              </div>
              <CardTitle className="text-xl mb-2">Create Your Account</CardTitle>
              <p className="text-muted-foreground text-sm">
                Join thousands of professionals and unlock all features
              </p>
            </CardHeader>
            <CardContent>
              <ul className="text-sm text-left space-y-2 mb-6">
                <li className="flex items-center gap-2">
                  <Sparkles className="h-4 w-4 text-green-600" />
                  <span>Save your work permanently</span>
                </li>
                <li className="flex items-center gap-2">
                  <Sparkles className="h-4 w-4 text-green-600" />
                  <span>Access advanced analytics</span>
                </li>
                <li className="flex items-center gap-2">
                  <Sparkles className="h-4 w-4 text-green-600" />
                  <span>Priority customer support</span>
                </li>
              </ul>
              <Button onClick={onSignUp} className="w-full">
                Create Free Account
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            </CardContent>
          </Card>

          <Card className="p-8 text-center border-l-4 border-l-green-500 hover:shadow-lg transition-shadow">
            <CardHeader className="pb-4">
              <div className="mx-auto mb-4 p-3 bg-green-100 rounded-full w-fit">
                <Sparkles className="h-8 w-8 text-green-600" />
              </div>
              <CardTitle className="text-xl mb-2">Try Our Free Generator</CardTitle>
              <p className="text-muted-foreground text-sm">
                Generate a high-quality blog post with backlinks in minutes
              </p>
            </CardHeader>
            <CardContent>
              <ul className="text-sm text-left space-y-2 mb-6">
                <li className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-blue-600" />
                  <span>24-hour trial backlink</span>
                </li>
                <li className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-blue-600" />
                  <span>Full SEO optimization</span>
                </li>
                <li className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-blue-600" />
                  <span>Instant publishing</span>
                </li>
              </ul>
              <Button onClick={onCreateTrial} variant="outline" className="w-full">
                Generate Free Trial Post
                <Sparkles className="h-4 w-4 ml-2" />
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Benefits showcase */}
        <div className="text-center">
          <h2 className="text-2xl font-light mb-8">Why Choose Our Platform?</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="p-6">
              <div className="text-3xl font-semibold text-blue-600 mb-2">High</div>
              <div className="text-sm text-muted-foreground">Success Rate</div>
            </div>
            <div className="p-6">
              <div className="text-3xl font-semibold text-blue-600 mb-2">Growing</div>
              <div className="text-sm text-muted-foreground">User Base</div>
            </div>
            <div className="p-6">
              <div className="text-3xl font-semibold text-blue-600 mb-2">Rated</div>
              <div className="text-sm text-muted-foreground">User Reviews</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
