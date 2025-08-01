import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { GuestDashboard } from '@/components/GuestDashboard';
import { UserBlogDashboard } from '@/components/UserBlogDashboard';
import { SafeDashboard } from '@/components/SafeDashboard';

export function EnhancedDashboardRouter() {
  const [user, setUser] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [hasTrialPosts, setHasTrialPosts] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    const checkUser = async () => {
      try {
        const { data: { user }, error } = await supabase.auth.getUser();

        if (error) {
          console.warn('Auth error:', error);
          setUser(null);
        } else {
          setUser(user);

          if (user) {
            // Check for trial posts in localStorage quickly
            try {
              const allBlogs = JSON.parse(localStorage.getItem('all_blog_posts') || '[]');
              const validTrialPosts = allBlogs.filter((post: any) => {
                if (!post.is_trial_post) return false;
                const postAge = Date.now() - new Date(post.created_at).getTime();
                return postAge < 24 * 60 * 60 * 1000; // 24 hours
              });
              setHasTrialPosts(validTrialPosts.length > 0);
            } catch (localStorageError) {
              console.warn('Error checking trial posts:', localStorageError);
              setHasTrialPosts(false);
            }
          }
        }
      } catch (error) {
        console.error('Auth check failed:', error);
        setUser(null);
      } finally {
        // No loading state needed
      }
    };

    checkUser();

    // Listen for auth changes with error handling
    let subscription: any;
    try {
      const { data: { subscription: authSubscription } } = supabase.auth.onAuthStateChange((event, session) => {
        try {
          setUser(session?.user || null);
        } catch (error) {
          console.warn('Error in auth state change:', error);
        }
      });
      subscription = authSubscription;
    } catch (error) {
      console.warn('Error setting up auth listener:', error);
    }

    return () => {
      try {
        subscription?.unsubscribe();
      } catch (error) {
        console.warn('Error unsubscribing:', error);
      }
    };
  }, []);



  // Always show the full dashboard (SafeDashboard handles auth gracefully)
  try {
    return <SafeDashboard />;
  } catch (error) {
    console.error('Dashboard component error:', error);
    // If SafeDashboard fails, show the full Dashboard directly
    const Dashboard = require('@/pages/Dashboard').default;
    return <Dashboard />;
  }
}
