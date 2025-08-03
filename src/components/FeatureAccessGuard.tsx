import { useState, useEffect, ReactNode } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Crown, Lock, Zap } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import SubscriptionService, { type SubscriptionStatus } from '@/services/subscriptionService';

interface FeatureAccessGuardProps {
  children: ReactNode;
  feature: 'keywordResearch' | 'automatedCampaigns' | 'rankTracker' | 'unlimitedAccess';
  featureName: string;
  fallbackMessage?: string;
}

export const FeatureAccessGuard = ({ 
  children, 
  feature, 
  featureName,
  fallbackMessage
}: FeatureAccessGuardProps) => {
  const { user } = useAuth();
  const [subscriptionStatus, setSubscriptionStatus] = useState<SubscriptionStatus | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const checkAccess = async () => {
      if (!user) {
        setIsLoading(false);
        return;
      }

      try {
        const status = await SubscriptionService.getSubscriptionStatus(user);
        setSubscriptionStatus(status);
      } catch (error) {
        console.error('Error checking feature access:', error);
      } finally {
        setIsLoading(false);
      }
    };

    checkAccess();
  }, [user]);

  // Loading state
  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Checking access...</p>
        </div>
      </div>
    );
  }

  // No user - show login prompt
  if (!user) {
    return (
      <Card className="border-2 border-primary/20">
        <CardHeader className="text-center">
          <div className="mx-auto w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mb-4">
            <Lock className="h-6 w-6 text-primary" />
          </div>
          <CardTitle>Sign In Required</CardTitle>
        </CardHeader>
        <CardContent className="text-center space-y-4">
          <p className="text-muted-foreground">
            Please sign in to access {featureName}
          </p>
          <Button onClick={() => window.location.href = '/login'}>
            Sign In
          </Button>
        </CardContent>
      </Card>
    );
  }

  // User has access - show feature
  if (subscriptionStatus?.features[feature]) {
    return <>{children}</>;
  }

  // User doesn't have access - show subscription required message
  return (
    <Card className="border-2 border-yellow-200 bg-gradient-to-br from-yellow-50 to-orange-50">
      <CardHeader className="text-center">
        <div className="mx-auto w-12 h-12 bg-yellow-100 rounded-full flex items-center justify-center mb-4">
          <Crown className="h-6 w-6 text-yellow-600" />
        </div>
        <CardTitle className="flex items-center justify-center gap-2">
          <Zap className="h-5 w-5 text-primary" />
          Premium Feature
        </CardTitle>
      </CardHeader>
      <CardContent className="text-center space-y-4">
        <p className="text-muted-foreground">
          {fallbackMessage || `Premium subscription required to access ${featureName}`}
        </p>
        
        <div className="bg-white p-4 rounded-lg border border-yellow-200">
          <div className="text-sm space-y-2">
            <p className="font-medium">This feature requires an active premium subscription</p>
            <ul className="text-left space-y-1 text-muted-foreground">
              <li>• Unlimited keyword research</li>
              <li>• Automated campaign management</li>
              <li>• Real-time rank tracking</li>
              <li>• Priority support</li>
            </ul>
          </div>
        </div>

        <p className="text-sm text-muted-foreground">
          Contact support if you believe you should have access to this feature.
        </p>
      </CardContent>
    </Card>
  );
};

export default FeatureAccessGuard;
