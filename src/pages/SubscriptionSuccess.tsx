import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CheckCircle, Crown, ArrowRight, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

const SubscriptionSuccess = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(true);
  const [subscriptionVerified, setSubscriptionVerified] = useState(false);

  useEffect(() => {
    const verifySubscription = async () => {
      const sessionId = searchParams.get('session_id');
      const isMock = searchParams.get('mock');
      const plan = searchParams.get('plan');

      // Handle mock subscriptions
      if (isMock === 'true') {
        console.log('🚧 Mock subscription success:', { sessionId, plan });
        setSubscriptionVerified(true);
        setIsLoading(false);
        toast({
          title: '🚧 Mock Subscription Activated!',
          description: `Mock mode: ${plan} subscription has been simulated for your account.`,
        });
        return;
      }

      if (!sessionId) {
        toast({
          title: 'Invalid Session',
          description: 'No session ID found in URL parameters.',
          variant: 'destructive',
        });
        navigate('/');
        return;
      }

      try {
        // Verify the subscription with our backend
        const { data, error } = await supabase.functions.invoke('verify-payment', {
          body: { 
            sessionId,
            type: 'subscription'
          }
        });

        if (error) {
          throw error;
        }

        if (data.verified) {
          setSubscriptionVerified(true);
          toast({
            title: 'Subscription Activated! 🎉',
            description: 'Welcome to Premium SEO Tools! You now have access to all features.',
          });
        } else {
          throw new Error('Subscription verification failed');
        }
      } catch (error: any) {
        console.error('Subscription verification error:', error);
        toast({
          title: 'Verification Error',
          description: 'There was an issue verifying your subscription. Please contact support.',
          variant: 'destructive',
        });
      } finally {
        setIsLoading(false);
      }
    };

    verifySubscription();
  }, [searchParams, navigate, toast]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center space-y-4">
          <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" />
          <p className="text-lg">Verifying your subscription...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <Card className="border-2 border-green-200 bg-green-50">
          <CardHeader className="text-center pb-4">
            <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
              <CheckCircle className="h-8 w-8 text-green-600" />
            </div>
            <CardTitle className="text-2xl text-green-800 mb-2">
              Subscription Activated!
            </CardTitle>
            <p className="text-green-700">
              Welcome to Backlink ∞ Premium SEO Tools
            </p>
          </CardHeader>
          
          <CardContent className="space-y-6">
            {subscriptionVerified && (
              <>
                <div className="space-y-3">
                  <h3 className="font-semibold flex items-center gap-2">
                    <Crown className="h-5 w-5 text-yellow-600" />
                    Your Premium Features
                  </h3>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-sm">
                      <CheckCircle className="h-4 w-4 text-green-600" />
                      <span>Unlimited keyword research</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <CheckCircle className="h-4 w-4 text-green-600" />
                      <span>Advanced SERP analysis</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <CheckCircle className="h-4 w-4 text-green-600" />
                      <span>Automated campaign management</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <CheckCircle className="h-4 w-4 text-green-600" />
                      <span>Real-time rank tracking</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <CheckCircle className="h-4 w-4 text-green-600" />
                      <span>Priority support</span>
                    </div>
                  </div>
                </div>

                <div className="bg-white p-4 rounded-lg border border-green-200">
                  <div className="text-center space-y-2">
                    <p className="font-medium">Your subscription is active</p>
                    <p className="text-sm text-muted-foreground">
                      You'll be charged $29/month starting today
                    </p>
                  </div>
                </div>
              </>
            )}

            <div className="space-y-3">
              <Button 
                onClick={() => navigate('/dashboard')}
                className="w-full bg-green-600 hover:bg-green-700"
                size="lg"
              >
                Access Your Dashboard
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
              
              <Button 
                variant="outline"
                onClick={() => navigate('/')}
                className="w-full"
              >
                Back to Home
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default SubscriptionSuccess;
