import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { GuestDashboard } from '@/components/GuestDashboard';
import { UserBlogDashboard } from '@/components/UserBlogDashboard';
import Dashboard from '@/pages/Dashboard';

export function EnhancedDashboardRouter() {
  const [user, setUser] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [hasTrialPosts, setHasTrialPosts] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    const checkUser = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        setUser(user);
        
        if (user) {
          // Check for trial posts in localStorage quickly
          const allBlogs = JSON.parse(localStorage.getItem('all_blog_posts') || '[]');
          const validTrialPosts = allBlogs.filter((post: any) => {
            if (!post.is_trial_post) return false;
            const postAge = Date.now() - new Date(post.created_at).getTime();
            return postAge < 24 * 60 * 60 * 1000; // 24 hours
          });
          setHasTrialPosts(validTrialPosts.length > 0);
        }
      } catch (error) {
        console.error('Auth check failed:', error);
        setUser(null);
      } finally {
        setIsLoading(false);
      }
    };

    checkUser();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setUser(session?.user || null);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-sm text-muted-foreground">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  // If user is authenticated, show protected dashboard
  if (user) {
    return hasTrialPosts ? <UserBlogDashboard /> : <Dashboard />;
  }

  // Show guest dashboard for non-authenticated users
  return <GuestDashboard />;
}
