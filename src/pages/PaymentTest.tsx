import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useToast } from '@/hooks/use-toast';
import { ImprovedPaymentModal } from '@/components/ImprovedPaymentModal';
import { stripePaymentService } from '@/services/stripePaymentService';
import {
  CreditCard,
  Crown,
  CheckCircle,
  XCircle,
  AlertCircle,
  Loader2,
  Zap,
  Shield,
  ExternalLink,
  Refresh
} from 'lucide-react';

export default function PaymentTest() {
  const { toast } = useToast();
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [paymentModalTab, setPaymentModalTab] = useState<'credits' | 'premium'>('credits');
  const [initialCredits, setInitialCredits] = useState<number | undefined>();
  const [testResults, setTestResults] = useState<Record<string, any>>({});
  const [isTestingEndpoints, setIsTestingEndpoints] = useState(false);
  const [serviceStatus, setServiceStatus] = useState(() => {
    try {
      return stripePaymentService.getStatus();
    } catch (error) {
      return { configured: false, mode: 'error' };
    }
  });

  // Test endpoints
  const testEndpoints = async () => {
    setIsTestingEndpoints(true);
    const results: Record<string, any> = {};

    // Test create-payment endpoint
    try {
      const response = await fetch('/.netlify/functions/create-payment', {
        method: 'OPTIONS'
      });
      results.createPayment = {
        status: response.status,
        ok: response.ok,
        endpoint: '/.netlify/functions/create-payment'
      };
    } catch (error) {
      results.createPayment = {
        status: 'error',
        ok: false,
        error: (error as Error).message,
        endpoint: '/.netlify/functions/create-payment'
      };
    }

    // Test create-subscription endpoint
    try {
      const response = await fetch('/.netlify/functions/create-subscription', {
        method: 'OPTIONS'
      });
      results.createSubscription = {
        status: response.status,
        ok: response.ok,
        endpoint: '/.netlify/functions/create-subscription'
      };
    } catch (error) {
      results.createSubscription = {
        status: 'error',
        ok: false,
        error: (error as Error).message,
        endpoint: '/.netlify/functions/create-subscription'
      };
    }

    setTestResults(results);
    setIsTestingEndpoints(false);
  };

  // Test actual payment creation
  const testPaymentCreation = async () => {
    try {
      toast({
        title: "Testing Real Payment Creation",
        description: "Creating live payment session...",
      });

      const result = await stripePaymentService.createPayment({
        amount: 10,
        credits: 7,
        productName: 'Test Payment',
        type: 'credits',
        isGuest: true,
        guestEmail: 'test@example.com'
      });

      if (result.success) {
        toast({
          title: "✅ Payment Test Successful",
          description: "Live Stripe session created successfully",
        });
      } else {
        throw new Error(result.error);
      }
    } catch (error) {
      toast({
        title: "❌ Payment Test Failed",
        description: error instanceof Error ? error.message : 'Unknown error',
        variant: "destructive"
      });
    }
  };

  // Test subscription creation
  const testSubscriptionCreation = async () => {
    try {
      toast({
        title: "Testing Real Subscription Creation",
        description: "Creating live subscription session...",
      });

      const result = await stripePaymentService.createSubscription({
        plan: 'monthly',
        amount: 29,
        type: 'subscription',
        isGuest: true,
        guestEmail: 'test@example.com'
      });

      if (result.success) {
        toast({
          title: "✅ Subscription Test Successful",
          description: "Live Stripe subscription created successfully",
        });
      } else {
        throw new Error(result.error);
      }
    } catch (error) {
      toast({
        title: "❌ Subscription Test Failed",
        description: error instanceof Error ? error.message : 'Unknown error',
        variant: "destructive"
      });
    }
  };

  // Open payment modal with specific configuration
  const openPaymentModal = (type: 'credits' | 'premium', credits?: number) => {
    setPaymentModalTab(type);
    setInitialCredits(credits);
    setIsPaymentModalOpen(true);
  };

  // Quick buy functions
  const quickBuy = async (credits: number) => {
    try {
      const result = await stripePaymentService.quickPurchase(
        credits as 50 | 100 | 250 | 500,
        'quickbuy@test.com'
      );

      if (result.success) {
        toast({
          title: "✅ Quick Buy Successful",
          description: `${credits} credits purchase initiated`,
        });
      } else {
        throw new Error(result.error);
      }
    } catch (error) {
      toast({
        title: "❌ Quick Buy Failed",
        description: error instanceof Error ? error.message : 'Unknown error',
        variant: "destructive"
      });
    }
  };

  // Premium upgrade
  const upgradePremium = async (plan: 'monthly' | 'yearly') => {
    try {
      const result = await stripePaymentService.purchasePremium(plan, 'premium@test.com');

      if (result.success) {
        toast({
          title: "✅ Premium Upgrade Successful",
          description: `${plan} plan upgrade initiated`,
        });
      } else {
        throw new Error(result.error);
      }
    } catch (error) {
      toast({
        title: "❌ Premium Upgrade Failed",
        description: error instanceof Error ? error.message : 'Unknown error',
        variant: "destructive"
      });
    }
  };

  useEffect(() => {
    testEndpoints();
    
    try {
      setServiceStatus(stripePaymentService.getStatus());
    } catch (error) {
      setServiceStatus({ configured: false, mode: 'error' });
    }
  }, []);

  return (
    <div className="container mx-auto p-6 space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Production Payment Testing</h1>
          <p className="text-muted-foreground">
            Test real Stripe payment processing
          </p>
        </div>
        <Button onClick={() => window.location.reload()} variant="outline">
          <Refresh className="h-4 w-4 mr-2" />
          Refresh
        </Button>
      </div>

      {/* Production Warning */}
      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          <strong>Production Mode:</strong> All payments will be processed with real credit cards. 
          Make sure you have proper Stripe keys configured.
        </AlertDescription>
      </Alert>

      {/* Configuration Status */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            System Status
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <span className="font-medium">Payment Mode</span>
            <Badge className="bg-green-100 text-green-800">
              <CheckCircle className="h-3 w-3 mr-1" />
              Production
            </Badge>
          </div>
          
          <div className="flex items-center justify-between">
            <span className="font-medium">Stripe Configuration</span>
            <Badge variant={serviceStatus.configured ? 'default' : 'destructive'}>
              {serviceStatus.configured ? 'Configured' : 'Error'}
            </Badge>
          </div>
        </CardContent>
      </Card>

      {/* Endpoint Tests */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="h-5 w-5" />
            Endpoint Tests
            <Button 
              onClick={testEndpoints} 
              disabled={isTestingEndpoints}
              variant="outline"
              size="sm"
            >
              {isTestingEndpoints ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                'Test Endpoints'
              )}
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {Object.entries(testResults).map(([key, result]) => (
              <div key={key} className="flex items-center justify-between p-3 border rounded">
                <div>
                  <span className="font-medium">{result.endpoint}</span>
                </div>
                <div className="flex items-center gap-2">
                  {result.ok ? (
                    <Badge className="bg-green-100 text-green-800">
                      <CheckCircle className="h-3 w-3 mr-1" />
                      {result.status}
                    </Badge>
                  ) : (
                    <Badge variant="destructive">
                      <XCircle className="h-3 w-3 mr-1" />
                      {result.status || 'Error'}
                    </Badge>
                  )}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Payment Modal Tests */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CreditCard className="h-5 w-5" />
            Payment Modal Tests
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Button onClick={() => openPaymentModal('credits')}>
              Open Credits Modal
            </Button>
            <Button onClick={() => openPaymentModal('credits', 100)}>
              Credits Modal (100)
            </Button>
            <Button onClick={() => openPaymentModal('premium')}>
              Open Premium Modal
            </Button>
            <Button onClick={() => openPaymentModal('premium')} variant="outline">
              Premium (Yearly)
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Direct API Tests */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="h-5 w-5" />
            Live Payment Tests
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Button onClick={testPaymentCreation} variant="outline">
              Test Live Payment
            </Button>
            <Button onClick={testSubscriptionCreation} variant="outline">
              Test Live Subscription
            </Button>
            <Button onClick={() => quickBuy(50)} variant="secondary">
              Buy 50 Credits ($70)
            </Button>
            <Button onClick={() => quickBuy(100)} variant="secondary">
              Buy 100 Credits ($140)
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Premium Tests */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Crown className="h-5 w-5" />
            Premium Subscription Tests
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4">
            <Button onClick={() => upgradePremium('monthly')} variant="outline">
              Monthly Premium ($29)
            </Button>
            <Button onClick={() => upgradePremium('yearly')} variant="outline">
              Yearly Premium ($290)
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Quick Purchase Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Real Purchase Tests</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Button onClick={() => quickBuy(250)} className="h-16">
              <div className="text-center">
                <div className="font-bold">250 Credits</div>
                <div className="text-sm">$350</div>
              </div>
            </Button>
            <Button onClick={() => quickBuy(500)} className="h-16">
              <div className="text-center">
                <div className="font-bold">500 Credits</div>
                <div className="text-sm">$700</div>
              </div>
            </Button>
            <Button onClick={() => upgradePremium('monthly')} className="h-16">
              <div className="text-center">
                <div className="font-bold">Monthly Premium</div>
                <div className="text-sm">$29/month</div>
              </div>
            </Button>
            <Button onClick={() => upgradePremium('yearly')} className="h-16">
              <div className="text-center">
                <div className="font-bold">Yearly Premium</div>
                <div className="text-sm">$290/year</div>
              </div>
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* External Test Links */}
      <Card>
        <CardHeader>
          <CardTitle>Direct Function Tests</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <Button 
              variant="outline" 
              className="w-full justify-between"
              onClick={() => window.open('/.netlify/functions/create-payment', '_blank')}
            >
              Test create-payment function directly
              <ExternalLink className="h-4 w-4" />
            </Button>
            <Button 
              variant="outline" 
              className="w-full justify-between"
              onClick={() => window.open('/.netlify/functions/create-subscription', '_blank')}
            >
              Test create-subscription function directly
              <ExternalLink className="h-4 w-4" />
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Payment Modal */}
      <ImprovedPaymentModal
        isOpen={isPaymentModalOpen}
        onClose={() => setIsPaymentModalOpen(false)}
        defaultTab={paymentModalTab}
        initialCredits={initialCredits}
      />
    </div>
  );
}
