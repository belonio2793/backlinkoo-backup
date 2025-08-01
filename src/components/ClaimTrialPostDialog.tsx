import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { publishedBlogService } from '@/services/publishedBlogService';
import { useNavigate } from 'react-router-dom';
import {
  Crown,
  Clock,
  CheckCircle2,
  ExternalLink,
  Loader2,
  Star,
  Shield,
  Infinity
} from 'lucide-react';

interface ClaimTrialPostDialogProps {
  children: React.ReactNode;
  trialPostSlug?: string;
  trialPostTitle?: string;
  expiresAt?: string;
  targetUrl?: string;
  onClaimed?: () => void;
}

export function ClaimTrialPostDialog({
  children,
  trialPostSlug,
  trialPostTitle,
  expiresAt,
  targetUrl,
  onClaimed
}: ClaimTrialPostDialogProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isClaiming, setIsClaiming] = useState(false);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const { toast } = useToast();
  const navigate = useNavigate();

  const getTimeRemaining = () => {
    if (!expiresAt) return null;
    
    const expires = new Date(expiresAt);
    const now = new Date();
    const diffMs = expires.getTime() - now.getTime();
    
    if (diffMs <= 0) return null;

    const hours = Math.floor(diffMs / (1000 * 60 * 60));
    const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
    
    return { hours, minutes };
  };

  const checkUserFreeClaims = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      setCurrentUser(user);

      if (!user) return { canClaim: true, hasExistingClaim: false, claimedCount: 0, maxClaims: 3 };

      // Use BlogClaimService for consistent claim limit checking
      const { BlogClaimService } = await import('@/services/blogClaimService');
      const claimStatus = await BlogClaimService.canUserClaimMore(user);

      return {
        canClaim: claimStatus.canClaim,
        hasExistingClaim: claimStatus.claimedCount > 0,
        claimedCount: claimStatus.claimedCount,
        maxClaims: claimStatus.maxClaims,
        reason: claimStatus.reason
      };
    } catch (error) {
      console.warn('Failed to check user claims:', error);
      return { canClaim: true, hasExistingClaim: false, claimedCount: 0, maxClaims: 3 };
    }
  };

  const claimTrialPost = async () => {
    if (!trialPostSlug) return;

    setIsClaiming(true);

    // Track claim operation for dashboard router
    localStorage.setItem('recent_claim_operation', Date.now().toString());

    try {
      const { canClaim, hasExistingClaim, claimedCount, maxClaims, reason } = await checkUserFreeClaims();

      if (!currentUser) {
        // Redirect to login/signup page with claim intent stored in localStorage
        localStorage.setItem('claim_intent', JSON.stringify({
          action: 'claim_trial_post',
          postSlug: trialPostSlug,
          postTitle: trialPostTitle,
          targetUrl: targetUrl,
          timestamp: Date.now()
        }));
        navigate('/login');
        return;
      }

      if (!canClaim) {
        toast({
          title: "Claim Limit Reached",
          description: reason || `You have reached the maximum limit of ${maxClaims} claimed posts. Please unclaim a post to claim a new one.`,
          variant: "destructive"
        });
        return;
      }

      // Get user email for notification
      const { data: profile } = await supabase
        .from('profiles')
        .select('email')
        .eq('user_id', currentUser.id)
        .single();

      // Find the blog post to claim
      const blogPostKey = `blog_post_${trialPostSlug}`;
      const localBlogPost = localStorage.getItem(blogPostKey);

      if (!localBlogPost) {
        throw new Error('Blog post not found');
      }

      const blogPostData = JSON.parse(localBlogPost);

      // Use BlogClaimService to handle localStorage posts
      const { BlogClaimService } = await import('@/services/blogClaimService');
      const claimResult = await BlogClaimService.claimLocalStoragePost(blogPostData, currentUser);



      if (!claimResult.success) {
        throw new Error(claimResult.message || claimResult.error || 'Failed to claim blog post');
      }

      // Track the claimed post for this user
      const userClaimedPosts = localStorage.getItem(`user_claimed_posts_${currentUser.id}`);
      const claimedPosts = userClaimedPosts ? JSON.parse(userClaimedPosts) : [];
      claimedPosts.push({
        slug: trialPostSlug,
        title: trialPostTitle,
        claimedAt: new Date().toISOString(),
        userId: currentUser.id,
        userEmail: profile?.email || currentUser.email
      });
      localStorage.setItem(`user_claimed_posts_${currentUser.id}`, JSON.stringify(claimedPosts));

      // Update the blog post to mark it as claimed
      try {
        const blogStorageKey = `blog_post_${trialPostSlug}`;
        const storedBlogData = localStorage.getItem(blogStorageKey);
        if (storedBlogData) {
          const blogPost = JSON.parse(storedBlogData);
          blogPost.is_trial_post = false;
          blogPost.claimed_by_user_id = currentUser.id;
          blogPost.claimed_by_email = profile?.email || currentUser.email;
          blogPost.claimed_at = new Date().toISOString();
          localStorage.setItem(blogStorageKey, JSON.stringify(blogPost));
        }
      } catch (error) {
        console.warn('Failed to update blog post claim status:', error);
      }

      // Create campaign entry
      try {
        const { error: campaignError } = await supabase
          .from('campaigns')
          .insert({
            name: `Claimed: ${trialPostTitle}`,
            target_url: targetUrl,
            keywords: [trialPostTitle?.split(' ').slice(0, 2).join(' ') || 'claimed post'],
            status: 'completed',
            links_requested: 1,
            links_delivered: 1,
            completed_backlinks: [`${window.location.origin}/blog/${trialPostSlug}`],
            user_id: currentUser.id,
            credits_used: 0
          });

        if (campaignError) {
          console.warn('Failed to create campaign entry:', campaignError);
        }
      } catch (campaignError) {
        console.warn('Failed to create campaign entry:', campaignError);
      }

      // Remove from local storage trial posts
      const storedTrialPosts = localStorage.getItem('trial_blog_posts');
      if (storedTrialPosts) {
        const posts = JSON.parse(storedTrialPosts);
        const updatedPosts = posts.filter((post: any) => post.slug !== trialPostSlug);
        localStorage.setItem('trial_blog_posts', JSON.stringify(updatedPosts));
      }

      toast({
        title: "🎉 Post Claimed Successfully!",
        description: `Your backlink is now permanent! Check your email for confirmation.`,
      });

      setIsOpen(false);
      onClaimed?.();

    } catch (error) {
      console.error('Failed to claim trial post:', error);
      toast({
        title: "Claim Failed",
        description: error instanceof Error ? error.message : "Failed to claim the trial post. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsClaiming(false);
      // Clean up claim operation tracking after 5 seconds
      setTimeout(() => {
        localStorage.removeItem('recent_claim_operation');
      }, 5000);
    }
  };

  const handleOpenDialog = async () => {
    const { canClaim } = await checkUserFreeClaims();
    setIsOpen(true);
  };

  const timeRemaining = getTimeRemaining();

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild onClick={handleOpenDialog}>
        {children}
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Crown className="h-5 w-5 text-green-600" />
            Claim Your Free Trial Post
          </DialogTitle>
          <DialogDescription>
            Save this trial post permanently. Each account can claim up to 3 posts since they auto-delete after 24 hours unless claimed.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Post Info */}
          <div className="bg-gray-50 rounded-lg p-4">
            <div className="flex items-start justify-between mb-2">
              <h4 className="font-medium text-sm line-clamp-2">{trialPostTitle}</h4>
              <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200 text-xs">
                Trial
              </Badge>
            </div>
            
            {timeRemaining && (
              <div className="flex items-center gap-1 text-xs text-red-600">
                <Clock className="h-3 w-3" />
                <span className="font-medium">
                  Expires in {timeRemaining.hours}h {timeRemaining.minutes}m
                </span>
              </div>
            )}
            
            {trialPostSlug && (
              <Button
                variant="ghost"
                size="sm"
                className="mt-2 h-auto p-0 text-xs text-blue-600 hover:text-blue-800"
                onClick={() => window.open(`/blog/${trialPostSlug}`, '_blank')}
              >
                <ExternalLink className="mr-1 h-3 w-3" />
                View live post
              </Button>
            )}
          </div>

          {/* Benefits */}
          <div className="space-y-3">
            <h4 className="font-medium text-sm">When you claim this post:</h4>
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm">
                <CheckCircle2 className="h-4 w-4 text-green-600" />
                <span>Becomes permanent (never expires)</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <Shield className="h-4 w-4 text-blue-600" />
                <span>Saved to your dashboard</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <Star className="h-4 w-4 text-yellow-600" />
                <span>Full SEO value maintained</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <Infinity className="h-4 w-4 text-purple-600" />
                <span>Lifetime backlink to {targetUrl}</span>
              </div>
            </div>
          </div>

          {/* Free Claim Notice */}
          <div className="bg-green-50 border border-green-200 rounded-lg p-3">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Free one-time claim:</span>
              <Badge className="bg-green-600 text-white">No Cost</Badge>
            </div>
            <p className="text-xs text-green-700 mt-1">
              Each account can claim up to 3 trial posts to prevent them from auto-deletion
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-2">
            {currentUser ? (
              <Button
                onClick={claimTrialPost}
                disabled={isClaiming}
                className="flex-1 bg-gradient-to-r from-yellow-600 to-orange-600 hover:from-yellow-700 hover:to-orange-700"
              >
                {isClaiming ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Claiming...
                  </>
                ) : (
                  <>
                    <Crown className="mr-2 h-4 w-4" />
                    Claim Free
                  </>
                )}
              </Button>
            ) : (
              <Button
                onClick={() => {
                  localStorage.setItem('claim_intent', JSON.stringify({
                    action: 'claim_trial_post',
                    postSlug: trialPostSlug,
                    postTitle: trialPostTitle,
                    targetUrl: targetUrl,
                    timestamp: Date.now()
                  }));
                  navigate('/login');
                }}
                className="flex-1 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
              >
                Sign Up to Claim
              </Button>
            )}
            
            <Button
              variant="outline"
              onClick={() => setIsOpen(false)}
              className="px-4"
            >
              Cancel
            </Button>
          </div>

          {!currentUser && (
            <p className="text-xs text-gray-500 text-center">
              Sign up to claim up to 3 trial posts permanently
            </p>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
