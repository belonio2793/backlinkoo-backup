import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import Dashboard from '../pages/Dashboard';
import { Loader2 } from 'lucide-react';

export function DashboardRouter() {
  const [user, setUser] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [hasTrialPosts, setHasTrialPosts] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const checkUserAndTrialPosts = async () => {
      try {
        // Check authentication
        const { data: { user } } = await supabase.auth.getUser();
        setUser(user);

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

        // Routing logic
        if (session?.user) {
          // User is logged in - redirect to protected dashboard
          navigate('/dashboard');
          return;
        } else {
          // User not logged in
          if (validTrialPosts.length > 0) {
            // Show trial dashboard
            return;
          } else {
            // No trial posts, redirect to homepage
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
  }, [navigate]);

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

  // Redirect to login if not authenticated
  // (This shouldn't happen due to useEffect navigation above)
  return null;
}
