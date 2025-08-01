import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { ClaimStatusService, type ClaimStatus } from '@/services/claimStatusService';
import { useNavigate } from 'react-router-dom';
import { 
  Hand, 
  CheckCircle, 
  XCircle, 
  AlertCircle, 
  LogIn,
  Loader2
} from 'lucide-react';

interface BlogClaimButtonProps {
  slug: string;
  postTitle?: string;
  onClaimSuccess?: (claimedCount: number) => void;
  className?: string;
}

export function BlogClaimButton({ 
  slug, 
  postTitle, 
  onClaimSuccess,
  className = ""
}: BlogClaimButtonProps) {
  const [claimStatus, setClaimStatus] = useState<ClaimStatus | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isClaiming, setIsClaiming] = useState(false);
  const { user, isAuthenticated } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    checkClaimStatus();
  }, [slug, user]);

  const checkClaimStatus = async () => {
    setIsLoading(true);
    try {
      const status = await ClaimStatusService.checkClaimStatus(slug, user?.id);
      setClaimStatus(status);
    } catch (error) {
      console.error('Error checking claim status:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleClaimClick = async () => {
    if (!isAuthenticated) {
      // Redirect to authentication or show login modal
      toast({
        title: 'Authentication Required',
        description: 'Please log in to claim blog posts',
        variant: 'default'
      });
      // You might want to redirect to a login page or show a login modal
      return;
    }

    if (!claimStatus?.canClaim) {
      return;
    }

    setIsClaiming(true);
    try {
      const result = await ClaimStatusService.claimPost(slug);
      
      if (result.success) {
        toast({
          title: '🎉 Blog post successfully claimed!',
          description: `You now have ${result.claimedCount}/3 claimed posts.`,
          variant: 'default'
        });

        // Refresh claim status
        await checkClaimStatus();
        
        // Call success callback
        if (onClaimSuccess && result.claimedCount) {
          onClaimSuccess(result.claimedCount);
        }
      } else {
        toast({
          title: 'Failed to claim post',
          description: result.error || 'An error occurred. Please try again.',
          variant: 'destructive'
        });
      }
    } catch (error) {
      console.error('Error claiming post:', error);
      toast({
        title: 'Error',
        description: 'An error occurred. Please try again.',
        variant: 'destructive'
      });
    } finally {
      setIsClaiming(false);
    }
  };

  const getButtonVariant = () => {
    if (!claimStatus) return 'outline';
    
    switch (claimStatus.reason) {
      case 'available':
        return 'default';
      case 'claimed_by_user':
        return 'secondary';
      case 'claimed_by_other':
        return 'outline';
      case 'limit_reached':
        return 'outline';
      case 'not_logged_in':
        return 'default';
      default:
        return 'outline';
    }
  };

  const getButtonIcon = () => {
    if (isLoading || isClaiming) {
      return <Loader2 className="h-4 w-4 animate-spin" />;
    }

    if (!claimStatus) return <Hand className="h-4 w-4" />;
    
    switch (claimStatus.reason) {
      case 'available':
        return <Hand className="h-4 w-4" />;
      case 'claimed_by_user':
        return <CheckCircle className="h-4 w-4" />;
      case 'claimed_by_other':
        return <XCircle className="h-4 w-4" />;
      case 'limit_reached':
        return <AlertCircle className="h-4 w-4" />;
      case 'not_logged_in':
        return <LogIn className="h-4 w-4" />;
      default:
        return <Hand className="h-4 w-4" />;
    }
  };

  const getStatusBadge = () => {
    if (!claimStatus) return null;

    const badgeText = `${claimStatus.claimedCount}/3 claimed`;
    const badgeVariant = claimStatus.claimedCount >= 3 ? 'destructive' : 
                        claimStatus.claimedCount >= 2 ? 'secondary' : 'outline';

    return (
      <Badge variant={badgeVariant} className="ml-2">
        {badgeText}
      </Badge>
    );
  };

  if (isLoading && !claimStatus) {
    return (
      <div className={`flex items-center gap-2 ${className}`}>
        <Button variant="outline" disabled>
          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
          Checking...
        </Button>
      </div>
    );
  }

  return (
    <div className={`flex flex-col sm:flex-row items-start sm:items-center gap-2 ${className}`}>
      <div className="flex items-center gap-2">
        <Button
          variant={getButtonVariant()}
          onClick={handleClaimClick}
          disabled={!claimStatus?.canClaim || isClaiming}
          className="flex items-center gap-2"
        >
          {getButtonIcon()}
          {ClaimStatusService.getClaimButtonText(claimStatus || { 
            canClaim: false, 
            reason: 'available', 
            claimedCount: 0 
          })}
        </Button>
        
        {isAuthenticated && getStatusBadge()}
      </div>

      {/* Helpful message */}
      {claimStatus && (
        <div className="text-xs text-muted-foreground">
          {claimStatus.reason === 'available' && isAuthenticated && 
            'Claim this post to make it permanently yours!'}
          {claimStatus.reason === 'claimed_by_user' && 
            'This post belongs to you forever.'}
          {claimStatus.reason === 'claimed_by_other' && 
            'This post has been claimed by another user.'}
          {claimStatus.reason === 'limit_reached' && 
            'You have reached the maximum of 3 claimed posts.'}
          {claimStatus.reason === 'not_logged_in' && 
            'Login to claim up to 3 blog posts.'}
        </div>
      )}
    </div>
  );
}
