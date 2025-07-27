import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate } from 'react-router-dom';
import { Clock, X } from 'lucide-react';

interface TrialPost {
  id: string;
  title: string;
  slug: string;
  expires_at: string;
  target_url: string;
  created_at: string;
}

export function TrialBottomNotification() {
  const [trialPosts, setTrialPosts] = useState<TrialPost[]>([]);
  const [isVisible, setIsVisible] = useState(false);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [isDismissed, setIsDismissed] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    checkUserAndTrialPosts();
    
    // Check every minute for updated trial posts
    const interval = setInterval(checkUserAndTrialPosts, 60000);
    
    return () => clearInterval(interval);
  }, []);

  const checkUserAndTrialPosts = async () => {
    try {
      // Check user authentication status
      const { data: { user } } = await supabase.auth.getUser();
      setCurrentUser(user);

      // If user is logged in, don't show trial notifications
      if (user) {
        setIsVisible(false);
        return;
      }

      // Get trial posts from in-memory storage (for guests)
      const storedTrialPosts = localStorage.getItem('trial_blog_posts');
      if (storedTrialPosts) {
        const posts: TrialPost[] = JSON.parse(storedTrialPosts);
        const activePosts = posts.filter(post => {
          const expiresAt = new Date(post.expires_at);
          const now = new Date();
          return now < expiresAt;
        });

        setTrialPosts(activePosts);
        setIsVisible(activePosts.length > 0 && !isDismissed);
      }
    } catch (error) {
      console.warn('Failed to check trial posts:', error);
    }
  };

  const getTimeRemaining = (expiresAt: string): { hours: number; minutes: number } => {
    const expires = new Date(expiresAt);
    const now = new Date();
    const diffMs = expires.getTime() - now.getTime();
    
    if (diffMs <= 0) {
      return { hours: 0, minutes: 0 };
    }

    const hours = Math.floor(diffMs / (1000 * 60 * 60));
    const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));

    return { hours, minutes };
  };

  const handleSignUp = () => {
    navigate('/auth-callback?action=signup&redirect=/dashboard');
  };

  const dismiss = () => {
    setIsDismissed(true);
    setIsVisible(false);
  };

  if (!isVisible || currentUser || trialPosts.length === 0) {
    return null;
  }

  const mostUrgentPost = trialPosts.reduce((urgent, post) => {
    const postTime = getTimeRemaining(post.expires_at);
    const urgentTime = getTimeRemaining(urgent.expires_at);
    return postTime.hours < urgentTime.hours ? post : urgent;
  });

  const timeRemaining = getTimeRemaining(mostUrgentPost.expires_at);

  return (
    <div className="fixed bottom-4 left-4 right-4 z-30 pointer-events-none">
      <div className="max-w-sm ml-auto pointer-events-auto">
        <div className="bg-white/90 backdrop-blur-sm border border-gray-200/50 rounded-lg shadow-lg p-4">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <Clock className="h-4 w-4 text-orange-500" />
              <div>
                <p className="text-xs text-gray-500 mb-1">
                  {trialPosts.length} trial post{trialPosts.length > 1 ? 's' : ''} expire{trialPosts.length === 1 ? 's' : ''} in
                </p>
                <p className="font-medium text-gray-700">
                  {timeRemaining.hours}h {timeRemaining.minutes}m
                </p>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <button
                onClick={handleSignUp}
                className="text-xs bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded-md transition-colors"
              >
                Save
              </button>
              <button
                onClick={dismiss}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
