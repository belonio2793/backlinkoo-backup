/**
 * Guest Campaign Restrictions Overlay
 * Shows warnings and restrictions for guest users on campaign controls
 */

import React, { useState } from 'react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { 
  AlertTriangle, Crown, Lock, Zap, Target, Link,
  TrendingUp, Shield, Infinity, ArrowRight, X
} from 'lucide-react';
import { guestTrackingService, type PremiumLimitWarning } from '@/services/guestTrackingService';
import { GuestPremiumUpsellModal } from './GuestPremiumUpsellModal';
import { cn } from '@/lib/utils';

interface GuestCampaignRestrictionsOverlayProps {
  campaignId?: string;
  children: React.ReactNode;
  feature?: 'campaign_creation' | 'link_generation' | 'analytics' | 'export' | 'controls';
  className?: string;
}

export function GuestCampaignRestrictionsOverlay({
  campaignId,
  children,
  feature = 'controls',
  className
}: GuestCampaignRestrictionsOverlayProps) {
  const [showPremiumModal, setShowPremiumModal] = useState(false);
  const [warningDismissed, setWarningDismissed] = useState(false);

  const { campaigns, restrictions } = guestTrackingService.getGuestCampaignsWithRestrictions();
  const guestStats = guestTrackingService.getGuestStats();

  // Find campaign-specific warnings
  const campaign = campaignId ? campaigns.find(c => c.id === campaignId) : null;
  const campaignWarnings = restrictions.warnings.filter(w => 
    campaignId ? w.type === 'link_limit' : true
  );

  // Feature-specific access check
  const featureAccess = feature === 'campaign_creation' ? 
    { allowed: restrictions.canCreateMore } :
    guestTrackingService.checkFeatureAccess(
      feature as 'advanced_analytics' | 'bulk_export' | 'priority_support' | 'custom_domains'
    );

  // Determine if we should show restrictions
  const shouldShowRestrictions = 
    !featureAccess.allowed ||
    campaignWarnings.length > 0 ||
    (campaign && campaign.linksGenerated >= 20);

  const getRestrictionContent = () => {
    if (feature === 'campaign_creation' && !restrictions.canCreateMore) {
      return {
        type: 'campaign_limit' as const,
        icon: <Target className="h-4 w-4" />,
        title: 'Campaign Limit Reached',
        message: `Free users can create up to ${restrictions.campaignsLimit} campaigns. You've used ${restrictions.campaignsUsed}.`,
        action: 'Upgrade for unlimited campaigns',
        severity: 'blocking' as const
      };
    }

    if (campaign && campaign.linksGenerated >= 20) {
      return {
        type: 'link_limit' as const,
        icon: <Link className="h-4 w-4" />,
        title: 'Link Limit Reached',
        message: `This campaign has reached the free limit of 20 links.`,
        action: 'Upgrade for unlimited links per campaign',
        severity: 'blocking' as const
      };
    }

    if (campaign && campaign.linksGenerated >= 15) {
      return {
        type: 'link_limit' as const,
        icon: <AlertTriangle className="h-4 w-4" />,
        title: 'Approaching Link Limit',
        message: `This campaign has ${campaign.linksGenerated}/20 links. You're close to the limit!`,
        action: 'Upgrade before hitting the limit',
        severity: 'warning' as const
      };
    }

    if (featureAccess.warning) {
      return {
        type: 'feature_limit' as const,
        icon: <Crown className="h-4 w-4" />,
        title: 'Premium Feature',
        message: featureAccess.warning.message,
        action: featureAccess.warning.upgradeCTA,
        severity: 'blocking' as const
      };
    }

    // General warning for guest users
    if (restrictions.campaignsUsed >= restrictions.campaignsLimit - 1) {
      return {
        type: 'campaign_limit' as const,
        icon: <AlertTriangle className="h-4 w-4" />,
        title: 'Almost at Campaign Limit',
        message: `You're using ${restrictions.campaignsUsed}/${restrictions.campaignsLimit} free campaigns.`,
        action: 'Upgrade for unlimited access',
        severity: 'warning' as const
      };
    }

    return null;
  };

  const restrictionContent = getRestrictionContent();

  const handleUpgradeClick = () => {
    setShowPremiumModal(true);
  };

  // If no restrictions and not warning, show children normally
  if (!shouldShowRestrictions || (!restrictionContent && warningDismissed)) {
    return <div className={className}>{children}</div>;
  }

  // If blocking restriction, overlay with blur
  if (restrictionContent?.severity === 'blocking') {
    return (
      <div className={cn("relative", className)}>
        {/* Blurred background content */}
        <div className="filter blur-sm pointer-events-none opacity-50">
          {children}
        </div>
        
        {/* Restriction overlay */}
        <div className="absolute inset-0 flex items-center justify-center bg-white/10 backdrop-blur-sm rounded-lg">
          <Card className="max-w-md mx-4 shadow-lg border-2 border-orange-200 bg-white">
            <CardContent className="p-6 text-center">
              <div className="h-12 w-12 bg-gradient-to-r from-orange-500 to-red-500 rounded-full flex items-center justify-center mx-auto mb-4 text-white">
                {restrictionContent.icon}
              </div>
              
              <h3 className="text-lg font-bold text-gray-900 mb-2">
                {restrictionContent.title}
              </h3>
              
              <p className="text-gray-600 mb-4 text-sm">
                {restrictionContent.message}
              </p>
              
              <div className="space-y-3">
                <Button
                  onClick={handleUpgradeClick}
                  className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
                >
                  <Crown className="h-4 w-4 mr-2" />
                  {restrictionContent.action}
                </Button>
                
                <div className="text-xs text-gray-500">
                  Upgrade to Premium • $49/month
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Premium Modal */}
        <GuestPremiumUpsellModal
          open={showPremiumModal}
          onOpenChange={setShowPremiumModal}
          trigger={restrictionContent.type}
          warning={featureAccess.warning}
        />
      </div>
    );
  }

  // Warning level - show content with warning banner
  return (
    <div className={cn("space-y-3", className)}>
      {restrictionContent && !warningDismissed && (
        <Alert className="border-yellow-200 bg-gradient-to-r from-yellow-50 to-orange-50">
          <div className="flex items-start gap-3">
            <div className="text-yellow-600 mt-0.5">
              {restrictionContent.icon}
            </div>
            <div className="flex-1">
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-medium text-yellow-800">
                    {restrictionContent.title}
                  </div>
                  <AlertDescription className="text-yellow-700 text-sm mt-1">
                    {restrictionContent.message}
                  </AlertDescription>
                </div>
                <div className="flex items-center gap-2 ml-4">
                  <Button
                    size="sm"
                    onClick={handleUpgradeClick}
                    className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-xs"
                  >
                    <Crown className="h-3 w-3 mr-1" />
                    Upgrade
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => setWarningDismissed(true)}
                    className="h-8 w-8 p-0 text-yellow-600 hover:text-yellow-800"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </Alert>
      )}

      {/* Usage Progress Bar */}
      {campaign && (
        <Card className="bg-gradient-to-r from-blue-50 to-purple-50 border-blue-200">
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <div className="text-sm font-medium text-gray-700">
                Campaign Progress
              </div>
              <Badge 
                variant={campaign.linksGenerated >= 20 ? "destructive" : "outline"}
                className="text-xs"
              >
                {campaign.linksGenerated}/20 links
              </Badge>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className={cn(
                  "h-2 rounded-full transition-all duration-300",
                  campaign.linksGenerated >= 20 ? "bg-red-500" :
                  campaign.linksGenerated >= 15 ? "bg-yellow-500" : "bg-green-500"
                )}
                style={{ width: `${Math.min((campaign.linksGenerated / 20) * 100, 100)}%` }}
              />
            </div>
            {campaign.linksGenerated >= 15 && (
              <div className="flex items-center justify-between mt-2 text-xs">
                <span className="text-gray-600">
                  {20 - campaign.linksGenerated} links remaining
                </span>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleUpgradeClick}
                  className="h-6 text-xs border-purple-200 text-purple-600 hover:bg-purple-50"
                >
                  <Infinity className="h-3 w-3 mr-1" />
                  Go Unlimited
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Original content */}
      {children}

      {/* Premium Modal */}
      <GuestPremiumUpsellModal
        open={showPremiumModal}
        onOpenChange={setShowPremiumModal}
        trigger={restrictionContent?.type || 'manual'}
        warning={featureAccess.warning}
      />
    </div>
  );
}
