import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { 
  Zap, 
  Crown, 
  User, 
  Link as LinkIcon,
  AlertCircle,
  CheckCircle
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';

interface AutomationHeaderProps {
  totalLinksBuilt: number;
  activeCampaigns: number;
  onUpgrade?: () => void;
}

export function AutomationHeader({ totalLinksBuilt, activeCampaigns, onUpgrade }: AutomationHeaderProps) {
  const { user, isPremium, isAuthenticated } = useAuth();

  // Determine user plan and limits
  const getUserPlan = () => {
    if (!isAuthenticated) return { plan: 'Guest', limit: 20, color: 'orange' };
    if (isPremium) return { plan: 'Premium', limit: Infinity, color: 'purple' };
    return { plan: 'Free', limit: 20, color: 'blue' };
  };

  const { plan, limit, color } = getUserPlan();
  const isNearLimit = totalLinksBuilt >= limit * 0.8; // 80% of limit
  const hasReachedLimit = totalLinksBuilt >= limit;

  const getLimitDisplay = () => {
    if (limit === Infinity) return 'Unlimited';
    return `${totalLinksBuilt}/${limit}`;
  };

  const getStatusColor = () => {
    if (hasReachedLimit) return 'destructive';
    if (isNearLimit) return 'warning';
    return 'default';
  };

  return (
    <Card className="mb-6">
      <CardContent className="pt-6">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          {/* Left side - Title and description */}
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-purple-600 rounded-lg flex items-center justify-center">
                <Zap className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">
                  Backlink Automation System
                </h1>
                <p className="text-sm text-muted-foreground">
                  Multi-engine backlink building across the web
                </p>
              </div>
            </div>
          </div>

          {/* Center - User plan and stats */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
            {/* User Plan Badge */}
            <div className="flex items-center gap-2">
              {isPremium ? (
                <Crown className="h-4 w-4 text-purple-600" />
              ) : (
                <User className="h-4 w-4 text-gray-600" />
              )}
              <Badge 
                variant={color === 'purple' ? 'default' : 'secondary'}
                className={`${
                  color === 'purple' 
                    ? 'bg-purple-100 text-purple-700 border-purple-200' 
                    : color === 'orange'
                    ? 'bg-orange-100 text-orange-700 border-orange-200'
                    : 'bg-blue-100 text-blue-700 border-blue-200'
                }`}
              >
                {plan} Plan
              </Badge>
            </div>

            {/* Stats */}
            <div className="flex items-center gap-4">
              <div className="text-center">
                <div className="text-sm font-medium text-gray-900">{activeCampaigns}</div>
                <div className="text-xs text-muted-foreground">Active</div>
              </div>
              <div className="text-center">
                <div className="flex items-center gap-1">
                  <LinkIcon className="h-3 w-3 text-muted-foreground" />
                  <span className="text-sm font-medium text-gray-900">
                    {getLimitDisplay()}
                  </span>
                </div>
                <div className="text-xs text-muted-foreground">Links Built</div>
              </div>
            </div>
          </div>

          {/* Right side - Action button and status */}
          <div className="flex items-center gap-3">
            {/* Limit Warning */}
            {isNearLimit && !isPremium && (
              <div className="flex items-center gap-1 text-sm">
                <AlertCircle className="h-4 w-4 text-orange-500" />
                <span className="text-orange-600">
                  {hasReachedLimit ? 'Limit reached' : 'Near limit'}
                </span>
              </div>
            )}

            {/* Status Indicator */}
            <div className="flex items-center gap-1">
              <CheckCircle className="h-4 w-4 text-green-500" />
              <span className="text-sm text-green-600">System Online</span>
            </div>

            {/* Upgrade Button */}
            {!isPremium && (
              <Button 
                onClick={onUpgrade}
                size="sm"
                className="bg-purple-600 hover:bg-purple-700 text-white"
              >
                <Crown className="h-4 w-4 mr-1" />
                Upgrade
              </Button>
            )}
          </div>
        </div>

        {/* Progress Bar for Non-Premium Users */}
        {!isPremium && limit !== Infinity && (
          <div className="mt-4">
            <div className="flex items-center justify-between text-xs text-muted-foreground mb-1">
              <span>Link Building Progress</span>
              <span>{totalLinksBuilt} of {limit} links used</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className={`h-2 rounded-full transition-all duration-300 ${
                  hasReachedLimit 
                    ? 'bg-red-500' 
                    : isNearLimit 
                    ? 'bg-orange-500' 
                    : 'bg-blue-500'
                }`}
                style={{ width: `${Math.min((totalLinksBuilt / limit) * 100, 100)}%` }}
              />
            </div>
            {hasReachedLimit && (
              <p className="text-xs text-red-600 mt-1">
                You've reached your {limit}-link limit. Upgrade to Premium for unlimited links.
              </p>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
