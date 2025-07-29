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

  useEffect(() => {
    const checkUserAndTrialPosts = async () => {
      try {
        // Check authentication
        const { data: { session } } = await supabase.auth.getSession();
        setUser(session?.user || null);

        // Check for trial posts in localStorage
        const allBlogs = JSON.parse(localStorage.getItem('all_blog_posts') || '[]');
        const validTrialPosts = allBlogs.filter((post: any) => {
          if (!post.is_trial_post) return false;
          
          // Check if expired
          if (post.expires_at) {
            const isExpired = new Date() > new Date(post.expires_at);
            return !isExpired;
          }
          return true;
        });
        
        setHasTrialPosts(validTrialPosts.length > 0);

        // Get guest analytics for dashboard display
        let guestData = null;
        if (!session?.user) {
          guestData = getGuestData();
          setGuestAnalytics({
            sessionDuration: getSessionDuration(),
            interactions: guestData.interactions
          });
        }

        // Routing logic
        if (session?.user) {
          // User is logged in - show dashboard directly
          setIsLoading(false);
          return;
        } else {
          // User not logged in - show appropriate dashboard or redirect
          if (validTrialPosts.length > 0) {
            // Show trial dashboard with conversion prompts
            return;
          } else if (guestData && (guestData.interactions > 0 || getSessionDuration() > 0)) {
            // Show guest onboarding dashboard for engaged visitors
            return;
          } else {
            // No engagement, redirect to homepage
            navigate('/');
            return;
          }
        }
      } catch (error) {
        console.error('Dashboard router error:', error);
        // Default to homepage on error
        navigate('/');
      } finally {
        setIsLoading(false);
      }
    };

    checkUserAndTrialPosts();
  }, [navigate, getGuestData, getSessionDuration]);

  if (isLoading) {
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
    return <Dashboard />;
  }

  // If user has trial posts, show enhanced trial dashboard
  if (hasTrialPosts) {
    return (
      <div className="min-h-screen bg-background">
        <GuestDashboard />
        
        {/* Enhanced trial conversion overlay */}
        <div className="fixed top-4 right-4 z-50 max-w-sm">
          <QuickTrialUpgrade
            onSuccess={(user) => {
              setUser(user);
              navigate('/my-dashboard');
            }}
            variant="default"
            size="sm"
          />
        </div>
        
        {/* Guest session reminder if conversion criteria met */}
        {shouldShowConversionPrompt() && (
          <GuestSessionReminder
            onSignUp={() => {
              trackInteraction('dashboard_guest_reminder');
              navigate('/login?from=dashboard');
            }}
            variant="floating"
            position="bottom"
          />
        )}
      </div>
    );
  }

  // Show guest onboarding dashboard for engaged visitors
  if (guestAnalytics.interactions > 0 || guestAnalytics.sessionDuration > 0) {
    return (
      <div className="min-h-screen bg-background">
        <GuestOnboardingDashboard
          sessionDuration={guestAnalytics.sessionDuration}
          interactions={guestAnalytics.interactions}
          onSignUp={() => {
            trackInteraction('onboarding_signup');
            navigate('/login?from=onboarding');
          }}
          onCreateTrial={() => {
            trackInteraction('onboarding_trial');
            navigate('/?focus=generator');
          }}
        />
      </div>
    );
  }

  // Fallback - this shouldn't happen due to useEffect navigation
  return null;
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
