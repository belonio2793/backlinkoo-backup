/**
 * Claim System Status - Shows the current status of claiming functionality
 */

import { useState, useEffect } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { UnifiedClaimService } from '@/services/unifiedClaimService';
import { useAuth } from '@/hooks/useAuth';
import { Crown, Users, FileText, AlertCircle } from 'lucide-react';

export function ClaimSystemStatus() {
  const { user } = useAuth();
  const [status, setStatus] = useState<{
    isOnline: boolean;
    claimableCount: number;
    userStats?: {
      claimedCount: number;
      maxClaims: number;
      canClaim: boolean;
    };
  }>({
    isOnline: false,
    claimableCount: 0
  });

  useEffect(() => {
    checkSystemStatus();
  }, [user]);

  const checkSystemStatus = async () => {
    try {
      // Test if the system is working by getting claimable posts
      const posts = await UnifiedClaimService.getClaimablePosts(1);

      let userStats = undefined;
      if (user) {
        try {
          userStats = await UnifiedClaimService.getUserClaimStats(user.id);
        } catch (userStatsError: any) {
          console.error('❌ Failed to get user claim stats:', {
            error: userStatsError?.message || userStatsError,
            userId: user.id,
            timestamp: new Date().toISOString()
          });
          // Continue without user stats rather than failing completely
        }
      }

      setStatus({
        isOnline: true,
        claimableCount: posts.length,
        userStats
      });
    } catch (error: any) {
      console.error('Claim system status check failed:', {
        error: error?.message || error,
        stack: error?.stack,
        name: error?.name,
        timestamp: new Date().toISOString(),
        userId: user?.id
      });
      setStatus({
        isOnline: false,
        claimableCount: 0
      });
    }
  };

  if (!status.isOnline) {
    return (
      <div className="flex items-center gap-2 text-red-600">
        <AlertCircle className="h-4 w-4" />
        <span className="text-sm">Claim system offline</span>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-3">
      <Badge variant="outline" className="flex items-center gap-1">
        <Crown className="h-3 w-3" />
        Claiming Online
      </Badge>
      
      {status.userStats && (
        <Badge 
          variant={status.userStats.canClaim ? "default" : "secondary"}
          className="flex items-center gap-1"
        >
          <Users className="h-3 w-3" />
          {`${status.userStats.claimedCount}/${status.userStats.maxClaims} claimed`}
        </Badge>
      )}
      
      <Badge variant="outline" className="flex items-center gap-1">
        <FileText className="h-3 w-3" />
        {`${status.claimableCount} available`}
      </Badge>
      
      <Button 
        variant="ghost" 
        size="sm" 
        onClick={checkSystemStatus}
        className="text-xs h-6 px-2"
      >
        Refresh
      </Button>
    </div>
  );
}
