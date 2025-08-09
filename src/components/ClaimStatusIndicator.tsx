/**
 * Claim Status Indicator - Shows user's claim limit and status
 */

import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Crown, Sparkles, Lock } from 'lucide-react';
import { ClaimableBlogService } from '@/services/claimableBlogService';
import { supabase } from '@/integrations/supabase/client';
import type { User } from '@supabase/supabase-js';

interface ClaimStatusIndicatorProps {
  onUpgrade?: () => void;
  onSignIn?: () => void;
}

export function ClaimStatusIndicator({ onUpgrade, onSignIn }: ClaimStatusIndicatorProps) {
  const [user, setUser] = useState<User | null>(null);
  const [claimedCount, setClaimedCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkUserAndClaims();
  }, []);

  const checkUserAndClaims = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);

      if (user) {
        const count = await ClaimableBlogService.getUserClaimedCount(user.id);
        setClaimedCount(count);
      }
    } catch (error) {
      console.error('Error checking user claims:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Card className="border-blue-200 bg-blue-50/50">
        <CardContent className="p-4">
          <div className="flex items-center space-x-2">
            <div className="w-4 h-4 bg-blue-300 rounded animate-pulse"></div>
            <span className="text-sm text-blue-700">Loading claim status...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!user) {
    return (
      <Card className="border-orange-200 bg-orange-50/50">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Lock className="w-4 h-4 text-orange-600" />
              <span className="text-sm text-orange-700">
                Sign in to claim posts permanently
              </span>
            </div>
            <Button size="sm" variant="outline" onClick={() => window.location.href = '/login'}>
              Sign In
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  const maxClaims = 3;
  const progressPercentage = (claimedCount / maxClaims) * 100;
  const remainingClaims = maxClaims - claimedCount;

  if (claimedCount >= maxClaims) {
    return (
      <Card className="border-purple-200 bg-gradient-to-r from-purple-50 to-pink-50">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Crown className="w-5 h-5 text-purple-600" />
              <div>
                <p className="text-sm font-semibold text-purple-800">
                  Claim Limit Reached (3/3)
                </p>
                <p className="text-xs text-purple-600">
                  Upgrade to Pro for unlimited claims
                </p>
              </div>
            </div>
            <Button size="sm" className="bg-purple-600 hover:bg-purple-700" onClick={onUpgrade}>
              <Crown className="w-4 h-4 mr-1" />
              Upgrade
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-green-200 bg-green-50/50">
      <CardContent className="p-4">
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Sparkles className="w-4 h-4 text-green-600" />
              <span className="text-sm font-semibold text-green-800">
                Claim Status: {claimedCount}/{maxClaims} Posts
              </span>
            </div>
            <Badge variant="outline" className="border-green-300 text-green-700">
              {remainingClaims} remaining
            </Badge>
          </div>
          
          <div className="space-y-1">
            <Progress value={progressPercentage} className="h-2" />
            <p className="text-xs text-green-600">
              {remainingClaims > 0 
                ? `You can claim ${remainingClaims} more post${remainingClaims !== 1 ? 's' : ''}`
                : 'All claims used - upgrade for unlimited claims'
              }
            </p>
          </div>

          {remainingClaims === 1 && (
            <div className="flex items-center justify-between pt-2 border-t border-green-200">
              <p className="text-xs text-green-600">Last claim available!</p>
              <Button size="sm" variant="outline" onClick={onUpgrade}>
                Need More?
              </Button>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
