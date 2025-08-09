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
  Clock, Shield, Infinity, Star, Gift, Rocket, Play, Pause
} from 'lucide-react';
import { guestTrackingService, type PremiumLimitWarning } from '@/services/guestTrackingService';
import { LoginModal } from '@/components/LoginModal';
import { useToast } from '@/hooks/use-toast';
import { paymentIntegrationService } from '@/services/paymentIntegrationService';

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
  const [selectedPlan, setSelectedPlan] = useState<'monthly' | 'yearly'>('monthly');
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
      const guestData = guestTrackingService.getGuestData();
      const guestEmail = guestData?.email || '';

      // Show processing message
      toast({
        title: "🚀 Creating Secure Checkout!",
        description: "Opening payment window...",
      });

      // Create subscription checkout session
      const result = await paymentIntegrationService.createSubscription(
        selectedPlan,
        true, // isGuest
        guestEmail
      );

      if (result.success && result.url) {
        // Open checkout in new window/tab
        const checkoutWindow = window.open(
          result.url,
          'stripe-checkout',
          'width=800,height=600,scrollbars=yes,resizable=yes'
        );

        if (checkoutWindow) {
          // Close modal since checkout opened
          onOpenChange(false);

          // Monitor the checkout window
          const checkClosed = setInterval(() => {
            if (checkoutWindow.closed) {
              clearInterval(checkClosed);
              toast({
                title: "Checkout Complete",
                description: "If you completed your purchase, please refresh the page to see your premium features!",
              });
            }
          }, 1000);

          if (onUpgrade) {
            onUpgrade();
          }
        } else {
          // Popup was blocked, fallback to same window
          toast({
            title: "Popup Blocked",
            description: "Opening checkout in current window...",
          });
          window.location.href = result.url;
        }
      } else {
        throw new Error(result.error || 'Failed to create checkout session');
      }
    } catch (error) {
      console.error('Upgrade error:', error);
      toast({
        title: "Checkout Error",
        description: error instanceof Error ? error.message : "Something went wrong. Please try again.",
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
    // Check if this is a campaign that's been auto-paused
    const hasLimitReachedCampaign = campaigns.some(c => c.linksGenerated >= 20);

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
          icon: <AlertTriangle className="h-10 w-10 text-white" />,
          title: hasLimitReachedCampaign ? '🛑 Campaign Paused - Limit Reached!' : '⚡ Link Limit Hit!',
          subtitle: hasLimitReachedCampaign
            ? 'Your campaign reached 20 links and has been paused. Upgrade to continue building unlimited links!'
            : 'This campaign has reached the 20-link free limit.',
          color: 'from-red-500 to-orange-500'
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

          {/* Paused Campaign Highlight */}
          {trigger === 'link_limit' && campaigns.some(c => c.linksGenerated >= 20) && (
            <div className="mb-8">
              <div className="bg-gradient-to-r from-red-50 to-orange-50 border-2 border-red-200 rounded-xl p-6">
                <h3 className="text-xl font-bold mb-4 flex items-center gap-2 text-red-800">
                  <AlertTriangle className="h-5 w-5" />
                  Campaign Paused
                </h3>
                {campaigns.filter(c => c.linksGenerated >= 20).map((campaign) => (
                  <div key={campaign.id} className="bg-white rounded-lg p-4 border border-red-200">
                    <div className="flex items-center justify-between mb-3">
                      <div>
                        <div className="font-semibold text-gray-900">{campaign.name}</div>
                        <div className="text-sm text-gray-600">{campaign.targetUrl}</div>
                      </div>
                      <Badge variant="destructive" className="bg-red-600">
                        <Pause className="h-3 w-3 mr-1" />
                        Paused at 20/20
                      </Badge>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-3 mb-3">
                      <div className="bg-red-500 h-3 rounded-full" style={{ width: '100%' }}></div>
                    </div>
                    <div className="text-sm text-red-700 bg-red-50 rounded p-2">
                      <strong>Campaign Status:</strong> This campaign reached the 20-link limit and has been automatically paused.
                      Your progress and all {campaign.linksGenerated} links are saved permanently.
                    </div>
                  </div>
                ))}
                <div className="mt-4 text-center">
                  <p className="text-red-800 font-medium">
                    🔓 Upgrade to Premium to reactivate and continue building unlimited links!
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Current Campaigns */}
          {campaigns.length > 0 && (
            <div className="mb-8">
              <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
                <BarChart3 className="h-5 w-5" />
                Your Campaign Progress
              </h3>
              <div className="space-y-3 max-h-32 overflow-y-auto">
                {campaigns.map((campaign) => (
                  <Card key={campaign.id} className={campaign.linksGenerated >= 20 ? "bg-red-50 border-red-200" : "bg-gray-50"}>
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
                            className={campaign.linksGenerated >= 20 ? "bg-red-600 text-white" : "text-green-600 bg-green-50"}
                          >
                            {campaign.linksGenerated}/20 links
                          </Badge>
                          {campaign.linksGenerated >= 20 && (
                            <div className="text-xs text-red-600 mt-1 font-medium">PAUSED - Upgrade to continue!</div>
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
                {campaigns.some(c => c.linksGenerated >= 20) ? 'Continue Your Paused Campaigns' : 'Premium Unlimited Access'}
              </h3>
              <p className="opacity-90">
                {campaigns.some(c => c.linksGenerated >= 20)
                  ? 'Upgrade now to reactivate paused campaigns and continue building unlimited links'
                  : 'Everything you need to dominate search results'
                }
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
              <div className="text-center">
                <div className="h-12 w-12 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-3">
                  <Infinity className="h-6 w-6" />
                </div>
                <div className="text-xl font-bold">Unlimited Everything</div>
                <div className="text-sm opacity-90">500+ links per campaign, unlimited campaigns</div>
              </div>
              <div className="text-center">
                <div className="h-12 w-12 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-3">
                  <Star className="h-6 w-6" />
                </div>
                <div className="text-xl font-bold">SEO Academy</div>
                <div className="text-sm opacity-90">Complete video courses & expert guidance</div>
              </div>
              <div className="text-center">
                <div className="h-12 w-12 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-3">
                  <Shield className="h-6 w-6" />
                </div>
                <div className="text-xl font-bold">Priority Support</div>
                <div className="text-sm opacity-90">Skip the line, get expert help fast</div>
              </div>
            </div>

            {/* Feature List */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
              <div className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4" />
                <span><strong>Unlimited Links</strong> - No more 20 link limits</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4" />
                <span><strong>SEO Academy Access</strong> - Complete training courses</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4" />
                <span><strong>Priority Support</strong> - Skip the line for help</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4" />
                <span>Advanced Analytics & Reporting</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4" />
                <span>Bulk Data Export & API Access</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4" />
                <span>White-label & Custom Branding</span>
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

          {/* Plan Selection */}
          <div className="mb-8">
            <h3 className="text-lg font-bold mb-4 text-center">Choose Your Plan</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div
                className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${
                  selectedPlan === 'monthly'
                    ? 'border-purple-600 bg-purple-50'
                    : 'border-gray-200 bg-white hover:border-purple-300'
                }`}
                onClick={() => setSelectedPlan('monthly')}
              >
                <div className="text-center">
                  <div className="text-xl font-bold text-purple-600">Monthly</div>
                  <div className="text-2xl font-bold">$29</div>
                  <div className="text-sm text-gray-600">per month</div>
                  <div className="text-xs text-gray-500 mt-2">Cancel anytime</div>
                </div>
              </div>
              <div
                className={`p-4 rounded-lg border-2 cursor-pointer transition-all relative ${
                  selectedPlan === 'yearly'
                    ? 'border-purple-600 bg-purple-50'
                    : 'border-gray-200 bg-white hover:border-purple-300'
                }`}
                onClick={() => setSelectedPlan('yearly')}
              >
                <div className="absolute -top-2 -right-2">
                  <Badge className="bg-green-600 text-white text-xs">Save 40%</Badge>
                </div>
                <div className="text-center">
                  <div className="text-xl font-bold text-purple-600">Yearly</div>
                  <div className="text-2xl font-bold">$17</div>
                  <div className="text-sm text-gray-600">per month</div>
                  <div className="text-xs text-gray-500 mt-2">Billed $199/year</div>
                </div>
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
                    Upgrade to Premium - {selectedPlan === 'monthly' ? '$29/month' : '$17/month (billed yearly)'}
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
