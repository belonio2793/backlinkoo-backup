import { useState, useEffect } from 'react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { publishedBlogService } from '@/services/publishedBlogService';
import { useNavigate } from 'react-router-dom';
import { 
  Clock, 
  AlertTriangle, 
  X, 
  ExternalLink, 
  Save,
  Crown
} from 'lucide-react';

interface TrialPost {
  id: string;
  title: string;
  slug: string;
  expires_at: string;
  target_url: string;
  created_at: string;
}

interface TrialNotificationBannerProps {
  onSignUp?: () => void;
}

export function TrialNotificationBanner({ onSignUp }: TrialNotificationBannerProps = {}) {
  const [trialPosts, setTrialPosts] = useState<TrialPost[]>([]);
  const [isVisible, setIsVisible] = useState(false);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [dismissedPosts, setDismissedPosts] = useState<Set<string>>(new Set());
  const navigate = useNavigate();

  useEffect(() => {
    checkUserAndTrialPosts();

    // Only check every 5 minutes to reduce load and random appearances
    // Also ensure we don't re-check if user is logged in or banner is dismissed
    const interval = setInterval(() => {
      if (!currentUser && isVisible) {
        checkUserAndTrialPosts();
      }
    }, 300000); // 5 minutes instead of 1 minute

    return () => clearInterval(interval);
  }, [currentUser, isVisible]);

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

      // Check if banner was globally dismissed for this session
      const sessionDismissed = sessionStorage.getItem('trial_banner_dismissed');
      if (sessionDismissed === 'true') {
        setIsVisible(false);
        return;
      }

      // Get trial posts from in-memory storage (for guests)
      const storedTrialPosts = localStorage.getItem('trial_blog_posts');
      if (storedTrialPosts) {
        const posts: TrialPost[] = JSON.parse(storedTrialPosts);

        // Load dismissed posts from localStorage for persistence
        const dismissedFromStorage = localStorage.getItem('dismissed_trial_posts');
        const dismissedIds = dismissedFromStorage ? new Set(JSON.parse(dismissedFromStorage)) : new Set();
        setDismissedPosts(dismissedIds);

        const activePosts = posts.filter(post => {
          const expiresAt = new Date(post.expires_at);
          const now = new Date();
          return now < expiresAt && !dismissedIds.has(post.id);
        });

        setTrialPosts(activePosts);
        setIsVisible(activePosts.length > 0);
      } else {
        setIsVisible(false);
      }
    } catch (error) {
      console.warn('Failed to check trial posts:', error);
      setIsVisible(false);
    }
  };

  const getTimeRemaining = (expiresAt: string): { hours: number; minutes: number; urgent: boolean } => {
    const expires = new Date(expiresAt);
    const now = new Date();
    const diffMs = expires.getTime() - now.getTime();
    
    if (diffMs <= 0) {
      return { hours: 0, minutes: 0, urgent: true };
    }

    const hours = Math.floor(diffMs / (1000 * 60 * 60));
    const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
    const urgent = hours < 2; // Show urgency when less than 2 hours remain

    return { hours, minutes, urgent };
  };

  const dismissNotification = (postId: string, dismissAll = false) => {
    if (dismissAll) {
      // Dismiss banner entirely for this session
      sessionStorage.setItem('trial_banner_dismissed', 'true');
      setIsVisible(false);
      return;
    }

    const newDismissedPosts = new Set(dismissedPosts).add(postId);
    setDismissedPosts(newDismissedPosts);

    // Persist dismissed posts to localStorage
    localStorage.setItem('dismissed_trial_posts', JSON.stringify([...newDismissedPosts]));

    setTrialPosts(prev => prev.filter(post => post.id !== postId));

    if (trialPosts.length <= 1) {
      setIsVisible(false);
    }
  };

  const handleSignUp = () => {
    if (onSignUp) {
      onSignUp();
    } else {
      navigate('/login');
    }
  };

  const handleQuickUpgrade = () => {
    // Open inline auth form with trial conversion focus
    navigate('/?upgrade=trial');
  };

  const viewTrialPost = (slug: string) => {
    window.open(`/blog/${slug}`, '_blank');
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
    <div className="fixed top-0 left-0 right-0 z-40 bg-gradient-to-r from-red-600 via-orange-600 to-red-600 text-white shadow-lg">
      <div className="max-w-7xl mx-auto px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <AlertTriangle className={`h-5 w-5 ${timeRemaining.urgent ? 'animate-pulse' : ''}`} />
              <Badge variant="outline" className="bg-white/20 text-white border-white/30">
                {trialPosts.length} Trial Post{trialPosts.length > 1 ? 's' : ''}
              </Badge>
            </div>
            
            <div className="hidden sm:block text-sm">
              <span className="font-semibold">
                {timeRemaining.urgent ? '🚨' : '⏰'} Trial backlink{trialPosts.length > 1 ? 's' : ''} expire{trialPosts.length === 1 ? 's' : ''} in{' '}
                <span className={`${timeRemaining.urgent ? 'animate-pulse font-bold text-yellow-200' : 'font-medium'}`}>
                  {timeRemaining.hours}h {timeRemaining.minutes}m
                </span>
              </span>
              <span className="ml-2 opacity-90">
                {timeRemaining.urgent ? 'Upgrade NOW to save them!' : 'Upgrade to permanent backlinks + unlock features'}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button
              size="sm"
              onClick={handleQuickUpgrade}
              className={`bg-white font-medium ${timeRemaining.urgent ? 'text-red-600 hover:bg-red-50 animate-pulse' : 'text-orange-600 hover:bg-orange-50'}`}
            >
              <Crown className="mr-1 h-4 w-4" />
              {timeRemaining.urgent ? 'Upgrade Now!' : 'Upgrade Trial'}
            </Button>
            
            {trialPosts.length === 1 && (
              <Button
                size="sm"
                variant="outline"
                onClick={() => viewTrialPost(mostUrgentPost.slug)}
                className="border-white/30 text-white hover:bg-white/10"
              >
                <ExternalLink className="mr-1 h-4 w-4" />
                View Post
              </Button>
            )}
            
            <Button
              size="sm"
              variant="ghost"
              onClick={(e) => {
                // If shift+click, dismiss all for session
                if (e.shiftKey) {
                  dismissNotification(mostUrgentPost.id, true);
                } else {
                  dismissNotification(mostUrgentPost.id);
                }
              }}
              className="text-white hover:bg-white/10 p-1"
              title="Click to dismiss this post, Shift+Click to hide banner completely"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Mobile layout */}
        <div className="sm:hidden mt-2 text-xs">
          <div className="flex items-center justify-between">
            <span>
              Expires in <span className="font-bold">{timeRemaining.hours}h {timeRemaining.minutes}m</span>
            </span>
            <button
              onClick={() => viewTrialPost(mostUrgentPost.slug)}
              className="underline"
            >
              View backlink post
            </button>
          </div>
        </div>

        {/* Multiple posts indicator */}
        {trialPosts.length > 1 && (
          <div className="mt-2 pt-2 border-t border-white/30">
            <div className="flex items-center justify-between text-xs">
              <span className="opacity-90">
                {trialPosts.length} posts ready • Most urgent expires in {timeRemaining.hours}h {timeRemaining.minutes}m
              </span>
              <button
                onClick={() => navigate('/blog')}
                className="underline hover:no-underline"
              >
                View all posts
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
