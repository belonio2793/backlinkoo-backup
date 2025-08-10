/**
 * Trial Exhausted Modal - Shows compelling results and drives conversion
 */

import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import {
  Crown, CheckCircle, TrendingUp, Target, Zap,
  UserPlus, BarChart3, Globe, Link, Sparkles, ArrowRight
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import SubscriptionService from '@/services/subscriptionService';

interface TrialExhaustedModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  guestResults: any[];
  totalLinks: number;
  isLoggedIn?: boolean;
  userName?: string;
  onUpgrade?: () => void;
}

export function TrialExhaustedModal({
  open,
  onOpenChange,
  guestResults,
  totalLinks,
  isLoggedIn = false,
  userName,
  onUpgrade
}: TrialExhaustedModalProps) {
  const { toast } = useToast();
  const [isProcessingUpgrade, setIsProcessingUpgrade] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<'monthly' | 'yearly'>('monthly');

  const totalDomains = guestResults.reduce((acc, campaign) =>
    acc + (campaign.domains?.length || 0), 0
  );

  const topDomains = guestResults.flatMap(c => c.domains || [])
    .slice(0, 6);

  const handleUpgradeClick = async () => {
    setIsProcessingUpgrade(true);
    try {
      // Show processing message
      toast({
        title: "🚀 Creating Secure Checkout!",
        description: "Opening Stripe payment window...",
      });

      // Create real subscription using SubscriptionService
      const result = await SubscriptionService.createSubscription(
        isLoggedIn ? { id: userName, email: userName } : null, // Pass user if logged in
        !isLoggedIn, // isGuest (opposite of isLoggedIn)
        !isLoggedIn ? 'guest@example.com' : undefined, // Guest email placeholder
        selectedPlan // Use the selected plan (monthly/yearly)
      );

      if (result.success && result.url) {
        // Close modal first
        onOpenChange(false);

        // Check if this is development fallback mode
        if (result.usedFallback) {
          toast({
            title: "✅ Premium Activated!",
            description: "Your account has been upgraded to Premium (development mode).",
            duration: 5000,
          });

          // Trigger upgrade callback
          if (onUpgrade) {
            onUpgrade();
          }

          // Redirect after short delay
          setTimeout(() => {
            window.location.href = result.url;
          }, 1000);
        } else {
          // Real Stripe checkout - open in same window for better mobile experience
          toast({
            title: "🔄 Redirecting to Stripe",
            description: "Opening secure payment portal...",
            duration: 3000,
          });

          // Trigger upgrade callback
          if (onUpgrade) {
            onUpgrade();
          }

          // Redirect to Stripe checkout
          window.location.href = result.url;
        }
      } else {
        throw new Error(result.error || 'Failed to create checkout session');
      }
    } catch (error) {
      console.error('Upgrade error:', {
        message: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined,
        name: error instanceof Error ? error.name : undefined
      });

      toast({
        title: "Checkout Error",
        description: error instanceof Error ? error.message : "Something went wrong. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsProcessingUpgrade(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader className="text-center pb-6">
          <div className="mx-auto mb-4">
            <div className="relative">
              <div className="h-20 w-20 bg-gradient-to-r from-green-400 to-blue-500 rounded-full flex items-center justify-center mx-auto">
                <CheckCircle className="h-10 w-10 text-white" />
              </div>
              <div className="absolute -top-2 -right-2">
                <Sparkles className="h-6 w-6 text-yellow-500 animate-pulse" />
              </div>
            </div>
          </div>
          
          <DialogTitle className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
            {isLoggedIn ?
              `🚀 ${userName ? `Hey ${userName.split(' ')[0]}!` : 'Hey there!'} Ready for Unlimited Campaigns?` :
              '🎉 SURPRISE! Look What You Just Built!'
            }
          </DialogTitle>
          <DialogDescription className="text-lg text-gray-600">
            {isLoggedIn ?
              'You\'ve reached your free campaign limit. Upgrade to premium for unlimited campaigns and advanced features!' :
              'While you were creating campaigns, our AI was secretly building premium backlinks for you!'
            }
          </DialogDescription>
        </DialogHeader>

        {/* Results Overview */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card className="bg-gradient-to-br from-green-50 to-emerald-50 border-green-200">
            <CardContent className="p-6 text-center">
              <div className="h-12 w-12 bg-green-600 rounded-full flex items-center justify-center mx-auto mb-3">
                <Link className="h-6 w-6 text-white" />
              </div>
              <div className="text-3xl font-bold text-green-600 mb-1">{totalLinks}</div>
              <div className="text-sm text-gray-600">High-Quality Backlinks</div>
              <div className="text-xs text-green-700 mt-1">Worth $400+ if outsourced</div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-blue-50 to-cyan-50 border-blue-200">
            <CardContent className="p-6 text-center">
              <div className="h-12 w-12 bg-blue-600 rounded-full flex items-center justify-center mx-auto mb-3">
                <Globe className="h-6 w-6 text-white" />
              </div>
              <div className="text-3xl font-bold text-blue-600 mb-1">{totalDomains}</div>
              <div className="text-sm text-gray-600">Authority Domains</div>
              <div className="text-xs text-blue-700 mt-1">Average DA: 75+</div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-purple-50 to-pink-50 border-purple-200">
            <CardContent className="p-6 text-center">
              <div className="h-12 w-12 bg-purple-600 rounded-full flex items-center justify-center mx-auto mb-3">
                <TrendingUp className="h-6 w-6 text-white" />
              </div>
              <div className="text-3xl font-bold text-purple-600 mb-1">{guestResults.length}</div>
              <div className="text-sm text-gray-600">Campaigns Completed</div>
              <div className="text-xs text-purple-700 mt-1">100% Success Rate</div>
            </CardContent>
          </Card>
        </div>

        {/* Plan Selection */}
        <div className="mb-3 flex flex-col items-center">
          <h3 className="text-lg font-bold mb-3 text-center text-black">Choose Your Plan</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-w-md">
            <div
              className={`p-3 rounded-lg border-2 cursor-pointer transition-all ${
                selectedPlan === 'monthly'
                  ? 'border-blue-600 bg-blue-50 shadow-md'
                  : 'border-gray-300 bg-white hover:border-blue-400'
              }`}
              onClick={() => setSelectedPlan('monthly')}
            >
              <div className="text-center text-black">
                <div className="text-base font-bold">Monthly</div>
                <div className="text-xl font-bold">$29</div>
                <div className="text-xs text-gray-600">per month</div>
                <div className="text-xs text-gray-500 mt-0.5">Cancel anytime</div>
              </div>
            </div>
            <div
              className={`p-3 rounded-lg border-2 cursor-pointer transition-all relative ${
                selectedPlan === 'yearly'
                  ? 'border-blue-600 bg-blue-50 shadow-md'
                  : 'border-gray-300 bg-white hover:border-blue-400'
              }`}
              onClick={() => setSelectedPlan('yearly')}
            >
              <div className="absolute -top-2 -right-2">
                <Badge className="bg-green-600 text-white text-xs">Save 40%</Badge>
              </div>
              <div className="text-center text-black">
                <div className="text-base font-bold">Yearly</div>
                <div className="text-xl font-bold">$17</div>
                <div className="text-xs text-gray-600">per month</div>
                <div className="text-xs text-gray-500 mt-0.5">Billed $199/year</div>
              </div>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="space-y-2 flex flex-col items-center mb-3">
          <div className="flex flex-col sm:flex-row gap-2 w-full max-w-lg">
            <Button
              size="lg"
              className="flex-1 h-12 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-semibold text-sm"
              onClick={handleUpgradeClick}
              disabled={isProcessingUpgrade}
            >
              {isProcessingUpgrade ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Creating Checkout...
                </>
              ) : (
                <>
                  <Crown className="h-4 w-4 mr-2" />
                  Upgrade to Premium - {selectedPlan === 'monthly' ? '$29/month' : '$17/month (billed yearly)'}
                  <ArrowRight className="h-4 w-4 ml-2" />
                </>
              )}
            </Button>
            {!isLoggedIn && (
              <Button
                size="lg"
                variant="outline"
                className="h-12 border-2 border-blue-600 text-blue-600 hover:bg-blue-50 font-semibold text-sm"
                onClick={() => onOpenChange(false)}
              >
                <UserPlus className="h-4 w-4 mr-2" />
                Create Free Account
              </Button>
            )}
          </div>
        </div>

        <div className="text-center mb-3">
          <div className="flex justify-center gap-2 text-xs text-gray-500 mb-2">
            <span>✓ 30-day money back guarantee</span>
            <span>✓ Cancel anytime</span>
            <span>✓ Priority support</span>
          </div>

          <Button
            variant="ghost"
            size="sm"
            onClick={() => onOpenChange(false)}
            className="w-full max-w-lg text-gray-500 text-xs py-1"
          >
            {isLoggedIn ? 'Continue with free account (1 campaign limit)' : 'Continue browsing (limited features)'}
          </Button>
        </div>

        {/* Value Proposition - Moved Below Continue Button */}
        <div className="bg-gradient-to-r from-purple-600 to-blue-600 rounded-lg p-3 text-white">
          <div className="text-center">
            <h3 className="text-base font-bold mb-2">Unlock Premium Power!</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-2 mb-3">
              <div className="text-center">
                <div className="text-xl font-bold">∞</div>
                <div className="text-xs opacity-90">Unlimited Links per Campaign</div>
              </div>
              <div className="text-center">
                <div className="text-xl font-bold">🎓</div>
                <div className="text-xs opacity-90">SEO Academy Access</div>
              </div>
              <div className="text-center">
                <div className="text-xl font-bold">⚡</div>
                <div className="text-xs opacity-90">Priority Support</div>
              </div>
            </div>

            {/* Additional Premium Features */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-1 text-xs text-white">
              <div className="flex items-center gap-1">
                <CheckCircle className="h-3 w-3 text-white" />
                <span className="text-white">Advanced analytics & reporting</span>
              </div>
              <div className="flex items-center gap-1">
                <CheckCircle className="h-3 w-3 text-white" />
                <span className="text-white">White-label options</span>
              </div>
              <div className="flex items-center gap-1">
                <CheckCircle className="h-3 w-3 text-white" />
                <span className="text-white">API access & bulk exports</span>
              </div>
              <div className="flex items-center gap-1">
                <CheckCircle className="h-3 w-3 text-white" />
                <span className="text-white">Priority customer support</span>
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
