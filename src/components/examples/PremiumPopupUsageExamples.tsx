import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { 
  PremiumTriggerButton, 
  UpgradeToPremiumButton, 
  FeatureLockedButton, 
  GetPremiumButton 
} from '../PremiumTriggerButton';
import { useOpenPremiumPopup } from '../PremiumPopupProvider';
import { 
  Crown, 
  Lock, 
  Star, 
  Zap, 
  TrendingUp, 
  Users, 
  Shield,
  Infinity,
  FileText,
  BarChart3,
  Settings,
  Sparkles
} from 'lucide-react';

// Example 1: Feature Card with Premium Lock
export function FeatureCardExample() {
  const { isPremium } = useOpenPremiumPopup();

  return (
    <Card className={`relative ${!isPremium ? 'opacity-75' : ''}`}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <TrendingUp className="h-5 w-5" />
          Advanced Analytics
          {!isPremium && <Badge variant="outline" className="ml-auto">Premium</Badge>}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-muted-foreground mb-4">
          Get detailed insights into your backlink performance with advanced analytics and reporting.
        </p>
        
        {isPremium ? (
          <Button className="w-full">
            View Analytics
          </Button>
        ) : (
          <FeatureLockedButton 
            featureName="Advanced Analytics"
            className="w-full"
          />
        )}
      </CardContent>
      
      {!isPremium && (
        <div className="absolute inset-0 bg-gradient-to-br from-transparent via-transparent to-black/5 pointer-events-none" />
      )}
    </Card>
  );
}

// Example 2: Header CTA
export function HeaderCTAExample() {
  const { isPremium } = useOpenPremiumPopup();

  if (isPremium) return null;

  return (
    <Alert className="mb-6 border-gradient-to-r from-purple-200 to-blue-200 bg-gradient-to-r from-purple-50 to-blue-50">
      <Crown className="h-4 w-4 text-yellow-500" />
      <AlertDescription className="flex items-center justify-between">
        <div>
          <span className="font-medium">Unlock unlimited backlinks and premium features!</span>
          <p className="text-sm text-muted-foreground mt-1">
            Join thousands of SEO professionals already using our premium tools.
          </p>
        </div>
        <UpgradeToPremiumButton />
      </AlertDescription>
    </Alert>
  );
}

// Example 3: Feature List with Locks
export function FeatureListExample() {
  const { isPremium } = useOpenPremiumPopup();

  const features = [
    { icon: <Infinity />, name: 'Unlimited Backlinks', premium: true, description: 'Create unlimited high-quality backlinks' },
    { icon: <BarChart3 />, name: 'Basic Analytics', premium: false, description: 'View basic performance metrics' },
    { icon: <Shield />, name: 'White-Hat Guarantee', premium: true, description: 'All backlinks follow best practices' },
    { icon: <Users />, name: 'Priority Support', premium: true, description: '24/7 dedicated support team' },
    { icon: <FileText />, name: 'Content Templates', premium: false, description: 'Access to basic templates' },
    { icon: <Star />, name: 'Professional Certifications', premium: true, description: 'Industry-recognized certificates' }
  ];

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold">Platform Features</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {features.map((feature, index) => (
          <Card key={index} className={`${feature.premium && !isPremium ? 'opacity-75' : ''}`}>
            <CardContent className="p-4">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3 flex-1">
                  <div className="text-blue-600">
                    {feature.icon}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <h4 className="font-medium">{feature.name}</h4>
                      {feature.premium && (
                        <Badge variant={isPremium ? "default" : "outline"} className="text-xs">
                          {isPremium ? "Active" : "Premium"}
                        </Badge>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground">{feature.description}</p>
                  </div>
                </div>
                
                {feature.premium && !isPremium && (
                  <Lock className="h-4 w-4 text-muted-foreground ml-2 flex-shrink-0" />
                )}
              </div>
              
              {feature.premium && !isPremium && (
                <div className="mt-3">
                  <GetPremiumButton size="sm" className="w-full" />
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

// Example 4: Navigation Bar Integration
export function NavigationExample() {
  const { isPremium } = useOpenPremiumPopup();

  return (
    <nav className="flex items-center justify-between p-4 bg-white border-b">
      <div className="flex items-center gap-6">
        <div className="text-xl font-bold">Backlinkoo</div>
        <div className="hidden md:flex items-center gap-4">
          <Button variant="ghost">Dashboard</Button>
          <Button variant="ghost">Analytics</Button>
          <Button variant="ghost">Campaigns</Button>
        </div>
      </div>
      
      <div className="flex items-center gap-3">
        {isPremium ? (
          <Badge className="bg-gradient-to-r from-yellow-400 to-orange-500">
            <Crown className="h-3 w-3 mr-1" />
            Premium
          </Badge>
        ) : (
          <GetPremiumButton size="sm" />
        )}
        
        <Button variant="ghost" size="sm">
          <Settings className="h-4 w-4" />
        </Button>
      </div>
    </nav>
  );
}

// Example 5: Usage Limit Component
export function UsageLimitExample() {
  const { isPremium, openPremiumPopup } = useOpenPremiumPopup();
  const currentUsage = 8; // Example current usage
  const limit = isPremium ? Infinity : 10;

  if (isPremium) {
    return (
      <Card className="bg-green-50 border-green-200">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <div className="font-medium text-green-900">Unlimited Usage</div>
              <div className="text-sm text-green-700">Premium plan active</div>
            </div>
            <Infinity className="h-8 w-8 text-green-600" />
          </div>
        </CardContent>
      </Card>
    );
  }

  const isNearLimit = currentUsage >= limit * 0.8;
  const isAtLimit = currentUsage >= limit;

  return (
    <Card className={`${isAtLimit ? 'bg-red-50 border-red-200' : isNearLimit ? 'bg-orange-50 border-orange-200' : 'bg-blue-50 border-blue-200'}`}>
      <CardContent className="p-4">
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <div className="font-medium">Backlinks Usage</div>
              <div className="text-sm text-muted-foreground">
                {currentUsage} / {limit} backlinks used
              </div>
            </div>
            <div className={`text-2xl font-bold ${isAtLimit ? 'text-red-600' : isNearLimit ? 'text-orange-600' : 'text-blue-600'}`}>
              {Math.round((currentUsage / limit) * 100)}%
            </div>
          </div>
          
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className={`h-2 rounded-full transition-all duration-300 ${
                isAtLimit ? 'bg-red-500' : isNearLimit ? 'bg-orange-500' : 'bg-blue-500'
              }`}
              style={{ width: `${Math.min((currentUsage / limit) * 100, 100)}%` }}
            />
          </div>
          
          {isNearLimit && (
            <div className="space-y-2">
              <Alert className={isAtLimit ? 'border-red-200' : 'border-orange-200'}>
                <AlertDescription className="text-sm">
                  {isAtLimit 
                    ? 'You\'ve reached your monthly limit. Upgrade to continue creating backlinks.'
                    : 'You\'re approaching your monthly limit. Consider upgrading to Premium.'
                  }
                </AlertDescription>
              </Alert>
              
              <PremiumTriggerButton 
                variant="cta" 
                className="w-full"
              >
                {isAtLimit ? 'Upgrade Now' : 'Upgrade to Premium'}
              </PremiumTriggerButton>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

// Example 6: Inline Feature Promotion
export function InlinePromotionExample() {
  const { isPremium } = useOpenPremiumPopup();

  if (isPremium) return null;

  return (
    <div className="my-6 p-4 bg-gradient-to-r from-purple-100 to-blue-100 rounded-lg border border-purple-200">
      <div className="flex items-start gap-4">
        <div className="flex-shrink-0">
          <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-blue-500 rounded-lg flex items-center justify-center">
            <Sparkles className="h-6 w-6 text-white" />
          </div>
        </div>
        
        <div className="flex-1">
          <h3 className="font-semibold text-gray-900 mb-1">
            Unlock Premium Features
          </h3>
          <p className="text-sm text-gray-700 mb-3">
            Get unlimited backlinks, advanced analytics, priority support, and more with our Premium plan.
          </p>
          
          <div className="flex items-center gap-3">
            <UpgradeToPremiumButton size="sm" />
            <span className="text-xs text-gray-600">Starting at $29/month</span>
          </div>
        </div>
      </div>
    </div>
  );
}

// Main example component showcasing all usage patterns
export function PremiumPopupUsageExamples() {
  return (
    <div className="max-w-6xl mx-auto p-6 space-y-8">
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-bold">Premium Popup Usage Examples</h1>
        <p className="text-muted-foreground">
          Various patterns for integrating the premium upgrade flow throughout your application
        </p>
      </div>

      <div className="space-y-8">
        <section>
          <h2 className="text-xl font-semibold mb-4">Navigation Integration</h2>
          <NavigationExample />
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-4">Header CTA</h2>
          <HeaderCTAExample />
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-4">Usage Tracking</h2>
          <div className="max-w-md">
            <UsageLimitExample />
          </div>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-4">Feature Cards</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <FeatureCardExample />
            <FeatureCardExample />
            <FeatureCardExample />
          </div>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-4">Feature List</h2>
          <FeatureListExample />
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-4">Inline Promotion</h2>
          <InlinePromotionExample />
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-4">Button Variations</h2>
          <div className="flex flex-wrap gap-4">
            <PremiumTriggerButton variant="default">Default Button</PremiumTriggerButton>
            <PremiumTriggerButton variant="outline">Outline Button</PremiumTriggerButton>
            <PremiumTriggerButton variant="cta">CTA Button</PremiumTriggerButton>
            <FeatureLockedButton featureName="Advanced Features" />
            <UpgradeToPremiumButton />
            <GetPremiumButton />
          </div>
        </section>
      </div>
    </div>
  );
}

export default PremiumPopupUsageExamples;
