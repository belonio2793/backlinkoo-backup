/**
 * Trial Exhausted Modal - Shows compelling results and drives conversion
 */

import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { 
  Crown, CheckCircle, TrendingUp, Target, Zap, 
  UserPlus, BarChart3, Globe, Link, Sparkles, ArrowRight 
} from 'lucide-react';

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
  
  const totalDomains = guestResults.reduce((acc, campaign) => 
    acc + (campaign.domains?.length || 0), 0
  );

  const topDomains = guestResults.flatMap(c => c.domains || [])
    .slice(0, 6);

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

        {/* Campaign Results */}
        <div className="mb-8">
          <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
            <Target className="h-5 w-5" />
            Your Campaigns
          </h3>
          <div className="space-y-3 max-h-40 overflow-y-auto">
            {guestResults.map((campaign, idx) => (
              <Card key={idx} className="bg-gray-50">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-semibold text-gray-900">{campaign.name}</div>
                      <div className="text-sm text-gray-600">
                        Keywords: {campaign.keywords.join(', ')}
                      </div>
                    </div>
                    <div className="text-right">
                      <Badge variant="outline" className="text-green-600 bg-green-50">
                        {campaign.linksGenerated} links
                      </Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Success Domains */}
        <div className="mb-8">
          <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            High-Authority Domains You Conquered
          </h3>
          <div className="flex flex-wrap gap-2">
            {topDomains.map((domain, idx) => (
              <Badge key={idx} variant="outline" className="bg-blue-50 text-blue-700">
                {domain}
              </Badge>
            ))}
          </div>
        </div>

        {/* Value Proposition */}
        <div className="bg-gradient-to-r from-purple-600 to-blue-600 rounded-xl p-6 text-white mb-8">
          <div className="text-center">
            <h3 className="text-2xl font-bold mb-3">
              {isLoggedIn ? 'Unlock Premium Power!' : 'This Was Just a Free Preview!'}
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <div className="text-center">
                <div className="text-3xl font-bold">∞</div>
                <div className="text-sm opacity-90">Unlimited Links per Campaign</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold">🎓</div>
                <div className="text-sm opacity-90">SEO Academy Access</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold">⚡</div>
                <div className="text-sm opacity-90">Priority Support</div>
              </div>
            </div>

            {/* Additional Premium Features */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm mt-6">
              <div className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4" />
                <span>More than 20 links per campaign</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4" />
                <span>Complete SEO Academy courses</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4" />
                <span>Priority customer support</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4" />
                <span>Advanced analytics & reporting</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4" />
                <span>White-label options</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4" />
                <span>API access & bulk exports</span>
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
              onClick={() => {
                if (onUpgrade) {
                  onUpgrade();
                }
                onOpenChange(false);
              }}
            >
              <Crown className="h-5 w-5 mr-2" />
              Upgrade to Premium - $29/month
              <ArrowRight className="h-5 w-5 ml-2" />
            </Button>
            {!isLoggedIn && (
              <Button
                size="lg"
                variant="outline"
                className="h-14 border-2 border-blue-600 text-blue-600 hover:bg-blue-50"
                onClick={() => onOpenChange(false)}
              >
                <UserPlus className="h-5 w-5 mr-2" />
                Create Free Account
              </Button>
            )}
          </div>
          
          <div className="text-center">
            <p className="text-sm text-gray-600 mb-2">
              {isLoggedIn ?
                '🔥 Special offer: Get 50% off your first premium month!' :
                '🔥 Limited Time: Get your first month 50% off when you upgrade now!'
              }
            </p>
            <div className="flex justify-center gap-4 text-xs text-gray-500">
              <span>✓ 30-day money back guarantee</span>
              <span>✓ Cancel anytime</span>
              <span>✓ Priority support</span>
            </div>
          </div>

          <Button
            variant="ghost"
            size="sm"
            onClick={() => onOpenChange(false)}
            className="w-full text-gray-500"
          >
            {isLoggedIn ? 'Continue with free account (1 campaign limit)' : 'Continue browsing (limited features)'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
