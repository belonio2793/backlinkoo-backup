import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { 
  Crown, 
  Zap, 
  Infinity, 
  Shield, 
  TrendingUp, 
  Clock,
  CheckCircle,
  X
} from 'lucide-react';

interface PremiumUpgradeModalProps {
  isOpen: boolean;
  onClose: () => void;
  linksPublished: number;
  maxLinks: number;
  onUpgrade: () => void;
  campaignName?: string;
}

export function PremiumUpgradeModal({
  isOpen,
  onClose,
  linksPublished,
  maxLinks,
  onUpgrade,
  campaignName
}: PremiumUpgradeModalProps) {
  const features = [
    {
      icon: <Infinity className="h-5 w-5 text-purple-600" />,
      title: "Unlimited Link Building",
      description: "Build unlimited high-authority backlinks across all platforms"
    },
    {
      icon: <Zap className="h-5 w-5 text-yellow-600" />,
      title: "5x Faster Processing",
      description: "Priority queue access with 5x faster link publishing speed"
    },
    {
      icon: <Shield className="h-5 w-5 text-green-600" />,
      title: "Advanced AI Content",
      description: "GPT-4 powered content generation with 98% uniqueness rate"
    },
    {
      icon: <TrendingUp className="h-5 w-5 text-blue-600" />,
      title: "Advanced Analytics",
      description: "Real-time performance tracking with detailed ROI metrics"
    },
    {
      icon: <Clock className="h-5 w-5 text-indigo-600" />,
      title: "24/7 Monitoring",
      description: "Continuous link health monitoring and automatic recovery"
    },
    {
      icon: <Crown className="h-5 w-5 text-orange-600" />,
      title: "Priority Support",
      description: "Dedicated support team with <1 hour response time"
    }
  ];

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader className="text-center pb-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex-1" />
            <div className="flex items-center gap-2">
              <Crown className="h-8 w-8 text-purple-600" />
              <DialogTitle className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
                Upgrade to Premium
              </DialogTitle>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="h-8 w-8 p-0"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
          
          <DialogDescription className="text-lg text-gray-600">
            You've reached your free limit of {maxLinks} published links. Upgrade to Premium for unlimited access and advanced features.
          </DialogDescription>
        </DialogHeader>

        {/* Limit Reached Alert */}
        <Card className="border-orange-200 bg-gradient-to-r from-orange-50 to-red-50 mb-6">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-orange-100 rounded-full">
                <Shield className="h-6 w-6 text-orange-600" />
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-orange-900 mb-1">
                  Free Limit Reached
                </h3>
                <p className="text-orange-700">
                  {campaignName && `Campaign "${campaignName}" has been paused. `}
                  You've published <strong>{linksPublished}/{maxLinks}</strong> links in the last 30 days.
                </p>
              </div>
              <Badge variant="outline" className="text-orange-600 bg-orange-100 border-orange-300">
                {linksPublished}/{maxLinks} Links Used
              </Badge>
            </div>
          </CardContent>
        </Card>

        {/* Premium Plans */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          {/* Professional Plan */}
          <Card className="border-2 border-blue-200 relative">
            <CardContent className="p-6">
              <div className="text-center mb-4">
                <h3 className="text-xl font-bold text-gray-900 mb-2">Professional</h3>
                <div className="flex items-baseline justify-center gap-1">
                  <span className="text-3xl font-bold text-blue-600">$29</span>
                  <span className="text-gray-500">/month</span>
                </div>
                <p className="text-sm text-gray-600 mt-2">Perfect for businesses and agencies</p>
              </div>
              
              <ul className="space-y-3 mb-6">
                <li className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  <span className="text-sm">Unlimited link building</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  <span className="text-sm">Up to 10 campaigns</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  <span className="text-sm">Advanced analytics</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  <span className="text-sm">Priority support</span>
                </li>
              </ul>
              
              <Button 
                onClick={onUpgrade}
                className="w-full bg-blue-600 hover:bg-blue-700"
                size="lg"
              >
                Upgrade to Professional
              </Button>
            </CardContent>
          </Card>

          {/* Enterprise Plan */}
          <Card className="border-2 border-purple-200 relative overflow-hidden">
            <div className="absolute top-0 left-0 right-0 bg-gradient-to-r from-purple-600 to-blue-600 text-white text-center py-2 text-sm font-medium">
              MOST POPULAR
            </div>
            
            <CardContent className="p-6 pt-12">
              <div className="text-center mb-4">
                <h3 className="text-xl font-bold text-gray-900 mb-2">Enterprise</h3>
                <div className="flex items-baseline justify-center gap-1">
                  <span className="text-3xl font-bold text-purple-600">$99</span>
                  <span className="text-gray-500">/month</span>
                </div>
                <p className="text-sm text-gray-600 mt-2">For serious link building at scale</p>
              </div>
              
              <ul className="space-y-3 mb-6">
                <li className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  <span className="text-sm">Everything in Professional</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  <span className="text-sm">Unlimited campaigns</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  <span className="text-sm">5x faster processing</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  <span className="text-sm">White-label reporting</span>
                </li>
              </ul>
              
              <Button 
                onClick={onUpgrade}
                className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
                size="lg"
              >
                <Crown className="h-4 w-4 mr-2" />
                Upgrade to Enterprise
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Premium Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
          {features.map((feature, index) => (
            <Card key={index} className="border border-gray-200">
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <div className="p-2 bg-gray-50 rounded-lg">
                    {feature.icon}
                  </div>
                  <div className="flex-1">
                    <h4 className="font-medium text-gray-900 mb-1">{feature.title}</h4>
                    <p className="text-xs text-gray-600">{feature.description}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Success Stats */}
        <Card className="border-green-200 bg-gradient-to-r from-green-50 to-blue-50 mb-6">
          <CardContent className="p-6">
            <div className="text-center">
              <h3 className="text-lg font-semibold text-green-900 mb-4">
                Join 12,847+ Premium Users Building Links Successfully
              </h3>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <div className="text-2xl font-bold text-blue-600">247,891</div>
                  <div className="text-sm text-gray-600">Links Built</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-green-600">94.7%</div>
                  <div className="text-sm text-gray-600">Success Rate</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-purple-600">24/7</div>
                  <div className="text-sm text-gray-600">Active Monitoring</div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Bottom Actions */}
        <div className="flex items-center justify-between pt-4 border-t">
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <Shield className="h-4 w-4" />
            <span>30-day money-back guarantee</span>
          </div>
          
          <div className="flex gap-3">
            <Button variant="outline" onClick={onClose}>
              Continue with Free Plan
            </Button>
            <Button 
              onClick={onUpgrade}
              className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
            >
              <Crown className="h-4 w-4 mr-2" />
              Upgrade Now
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
