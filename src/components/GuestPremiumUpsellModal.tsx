/**
 * Guest Premium Upsell Modal
 * Shows when guests hit limits and drives conversion to premium
 */

import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { 
  Crown, CheckCircle, TrendingUp, Target, Zap, AlertTriangle,
  UserPlus, BarChart3, Globe, Link, Sparkles, ArrowRight, X,
  Clock, Shield, Infinity, Star, Gift, Rocket
} from 'lucide-react';
import { guestTrackingService, type PremiumLimitWarning } from '@/services/guestTrackingService';
import { LoginModal } from '@/components/LoginModal';
import { useToast } from '@/hooks/use-toast';

interface GuestPremiumUpsellModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  trigger: 'campaign_limit' | 'link_limit' | 'feature_limit' | 'manual';
  warning?: PremiumLimitWarning;
  onUpgrade?: () => void;
}

export function GuestPremiumUpsellModal({
  open,
  onOpenChange,
  trigger,
  warning,
  onUpgrade
}: GuestPremiumUpsellModalProps) {
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [isProcessingUpgrade, setIsProcessingUpgrade] = useState(false);
  const { toast } = useToast();

  const guestStats = guestTrackingService.getGuestStats();
  const { campaigns, restrictions } = guestTrackingService.getGuestCampaignsWithRestrictions();

  // Mark premium prompt as shown when modal opens
  useEffect(() => {
    if (open) {
      guestTrackingService.markPremiumPromptShown();
    }
  }, [open]);

  const handleUpgrade = async () => {
    setIsProcessingUpgrade(true);
    try {
      // Redirect to payment page with guest tracking data
      const checkoutUrl = `/subscription-success?guest_id=${guestTrackingService.getGuestData()?.userId}&source=guest_upsell&trigger=${trigger}`;
      
      if (onUpgrade) {
        onUpgrade();
      }
      
      // Close modal and redirect
      onOpenChange(false);
      window.location.href = checkoutUrl;
    } catch (error) {
      console.error('Upgrade error:', error);
      toast({
        title: "Upgrade Error",
        description: "Something went wrong. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsProcessingUpgrade(false);
    }
  };

  const handleCreateAccount = () => {
    onOpenChange(false);
    setShowLoginModal(true);
  };

  const getModalContent = () => {
    switch (trigger) {
      case 'campaign_limit':
        return {
          icon: <Target className="h-10 w-10 text-white" />,
          title: '🚀 Campaign Limit Reached!',
          subtitle: 'You\'ve maxed out your free campaigns. Time to go unlimited!',
          color: 'from-orange-500 to-red-500'
        };
      case 'link_limit':
        return {
          icon: <Link className="h-10 w-10 text-white" />,
          title: '⚡ Link Limit Hit!',
          subtitle: 'This campaign has reached the 20-link free limit.',
          color: 'from-blue-500 to-purple-500'
        };
      case 'feature_limit':
        return {
          icon: <Crown className="h-10 w-10 text-white" />,
          title: '👑 Premium Feature',
          subtitle: 'This feature is available with Premium membership.',
          color: 'from-purple-500 to-pink-500'
        };
      default:
        return {
          icon: <Sparkles className="h-10 w-10 text-white" />,
          title: '✨ Upgrade to Premium',
          subtitle: 'Unlock unlimited campaigns and premium features!',
          color: 'from-green-500 to-blue-500'
        };
    }
  };

  const modalContent = getModalContent();

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader className="text-center pb-6">
            <div className="mx-auto mb-4">
              <div className="relative">
                <div className={`h-20 w-20 bg-gradient-to-r ${modalContent.color} rounded-full flex items-center justify-center mx-auto`}>
                  {modalContent.icon}
                </div>
                <div className="absolute -top-2 -right-2">
                  <Sparkles className="h-6 w-6 text-yellow-500 animate-pulse" />
                </div>
              </div>
            </div>
            
            <DialogTitle className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
              {modalContent.title}
            </DialogTitle>
            <p className="text-lg text-gray-600">
              {modalContent.subtitle}
            </p>
          </DialogHeader>

          {/* Warning Message */}
          {warning && (
            <div className="mb-6 p-4 bg-gradient-to-r from-yellow-50 to-orange-50 border border-yellow-200 rounded-lg">
              <div className="flex items-start gap-3">
                <AlertTriangle className="h-5 w-5 text-yellow-600 mt-0.5" />
                <div>
                  <p className="text-yellow-800 font-medium">{warning.message}</p>
                  <p className="text-yellow-700 text-sm mt-1">{warning.upgradeCTA}</p>
                </div>
              </div>
            </div>
          )}

          {/* Usage Statistics */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
            <Card className="bg-gradient-to-br from-blue-50 to-cyan-50 border-blue-200">
              <CardContent className="p-4 text-center">
                <div className="h-10 w-10 bg-blue-600 rounded-full flex items-center justify-center mx-auto mb-2">
                  <Target className="h-5 w-5 text-white" />
                </div>
                <div className="text-2xl font-bold text-blue-600 mb-1">{guestStats.campaignsCreated}</div>
                <div className="text-xs text-gray-600">Campaigns Created</div>
                <Progress 
                  value={(restrictions.campaignsUsed / restrictions.campaignsLimit) * 100} 
                  className="h-1 mt-2"
                />
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-green-50 to-emerald-50 border-green-200">
              <CardContent className="p-4 text-center">
                <div className="h-10 w-10 bg-green-600 rounded-full flex items-center justify-center mx-auto mb-2">
                  <Link className="h-5 w-5 text-white" />
                </div>
                <div className="text-2xl font-bold text-green-600 mb-1">{guestStats.totalLinksGenerated}</div>
                <div className="text-xs text-gray-600">Links Built</div>
                <div className="text-xs text-green-700 mt-1">Worth ${guestStats.estimatedValue}+</div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-purple-50 to-pink-50 border-purple-200">
              <CardContent className="p-4 text-center">
                <div className="h-10 w-10 bg-purple-600 rounded-full flex items-center justify-center mx-auto mb-2">
                  <Clock className="h-5 w-5 text-white" />
                </div>
                <div className="text-2xl font-bold text-purple-600 mb-1">{guestStats.daysActive}</div>
                <div className="text-xs text-gray-600">Days Active</div>
                <div className="text-xs text-purple-700 mt-1">Building links!</div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-amber-50 to-yellow-50 border-amber-200">
              <CardContent className="p-4 text-center">
                <div className="h-10 w-10 bg-amber-600 rounded-full flex items-center justify-center mx-auto mb-2">
                  <TrendingUp className="h-5 w-5 text-white" />
                </div>
                <div className="text-2xl font-bold text-amber-600 mb-1">75+</div>
                <div className="text-xs text-gray-600">Avg Domain Authority</div>
                <div className="text-xs text-amber-700 mt-1">High quality!</div>
              </CardContent>
            </Card>
          </div>

          {/* Current Campaigns */}
          {campaigns.length > 0 && (
            <div className="mb-8">
              <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
                <BarChart3 className="h-5 w-5" />
                Your Active Campaigns
              </h3>
              <div className="space-y-3 max-h-32 overflow-y-auto">
                {campaigns.map((campaign) => (
                  <Card key={campaign.id} className="bg-gray-50">
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="font-semibold text-gray-900">{campaign.name}</div>
                          <div className="text-sm text-gray-600">
                            Keywords: {campaign.keywords.slice(0, 3).join(', ')}
                            {campaign.keywords.length > 3 ? '...' : ''}
                          </div>
                        </div>
                        <div className="text-right">
                          <Badge 
                            variant={campaign.linksGenerated >= 20 ? "destructive" : "outline"}
                            className={campaign.linksGenerated >= 20 ? "bg-red-50 text-red-600" : "text-green-600 bg-green-50"}
                          >
                            {campaign.linksGenerated}/20 links
                          </Badge>
                          {campaign.linksGenerated >= 20 && (
                            <div className="text-xs text-red-600 mt-1">Limit reached!</div>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {/* Premium Benefits */}
          <div className="bg-gradient-to-r from-purple-600 to-blue-600 rounded-xl p-6 text-white mb-8">
            <div className="text-center mb-6">
              <h3 className="text-2xl font-bold mb-2 flex items-center justify-center gap-2">
                <Crown className="h-6 w-6" />
                Premium Unlimited Access
              </h3>
              <p className="opacity-90">Everything you need to dominate search results</p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
              <div className="text-center">
                <div className="h-12 w-12 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-3">
                  <Infinity className="h-6 w-6" />
                </div>
                <div className="text-xl font-bold">∞ Campaigns</div>
                <div className="text-sm opacity-90">No limits on campaigns</div>
              </div>
              <div className="text-center">
                <div className="h-12 w-12 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-3">
                  <Zap className="h-6 w-6" />
                </div>
                <div className="text-xl font-bold">500+ Links</div>
                <div className="text-sm opacity-90">Per campaign, per month</div>
              </div>
              <div className="text-center">
                <div className="h-12 w-12 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-3">
                  <Shield className="h-6 w-6" />
                </div>
                <div className="text-xl font-bold">24/7 Support</div>
                <div className="text-sm opacity-90">Priority assistance</div>
              </div>
            </div>

            {/* Feature List */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
              <div className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4" />
                <span>Advanced Analytics & Reporting</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4" />
                <span>Bulk Data Export</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4" />
                <span>Custom Domain Integration</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4" />
                <span>API Access</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4" />
                <span>White-label Options</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4" />
                <span>Priority Link Building</span>
              </div>
            </div>
          </div>

          {/* Special Offer */}
          <div className="bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-lg p-6 mb-8">
            <div className="text-center">
              <div className="flex items-center justify-center gap-2 mb-2">
                <Gift className="h-5 w-5 text-green-600" />
                <span className="text-lg font-bold text-green-800">Limited Time Offer!</span>
              </div>
              <p className="text-green-700 mb-3">
                Get <span className="font-bold">50% OFF</span> your first month when you upgrade now!
              </p>
              <div className="flex items-center justify-center gap-4 text-sm text-green-600">
                <span>✓ 30-day money back guarantee</span>
                <span>✓ Cancel anytime</span>
                <span>✓ Instant access</span>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row gap-3">
              <Button
                size="lg"
                className="flex-1 h-14 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
                onClick={handleUpgrade}
                disabled={isProcessingUpgrade}
              >
                {isProcessingUpgrade ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                    Processing...
                  </>
                ) : (
                  <>
                    <Crown className="h-5 w-5 mr-2" />
                    Upgrade to Premium - $24.50/month
                    <ArrowRight className="h-5 w-5 ml-2" />
                  </>
                )}
              </Button>
            </div>
            
            <div className="flex flex-col sm:flex-row gap-3">
              <Button
                size="lg"
                variant="outline"
                className="flex-1 h-12 border-2 border-blue-600 text-blue-600 hover:bg-blue-50"
                onClick={handleCreateAccount}
              >
                <UserPlus className="h-5 w-5 mr-2" />
                Create Free Account First
              </Button>
              
              <Button
                variant="ghost"
                size="lg"
                onClick={() => onOpenChange(false)}
                className="h-12 text-gray-500 hover:text-gray-700"
              >
                Continue with limits
              </Button>
            </div>

            <div className="text-center text-xs text-gray-500 space-y-1">
              <p>By upgrading, you agree to our Terms of Service and Privacy Policy</p>
              <p>Secure payment processed by Stripe</p>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Login Modal for Account Creation */}
      <LoginModal 
        open={showLoginModal}
        onOpenChange={setShowLoginModal}
      />
    </>
  );
}
