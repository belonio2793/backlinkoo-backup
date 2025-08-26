import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import { stripePaymentService } from '@/services/stripePaymentService';
import { DirectStripeCheckout } from '@/services/directStripeCheckout';
import { ImprovedPaymentModal } from '@/components/ImprovedPaymentModal';
import { PaymentDashboard } from '@/components/EnhancedDirectPaymentButtons';
import { PremiumUpgradeButton, HeaderUpgradeButton, YearlyUpgradeButton } from '@/components/PremiumUpgradeButton';
import { BuyCreditsButton, QuickBuy100Button } from '@/components/BuyCreditsButton';
import { 
  CreditCard, 
  Crown, 
  Settings, 
  CheckCircle, 
  XCircle, 
  ExternalLink, 
  Zap,
  Shield 
} from 'lucide-react';

export function StripeTestPage() {
  const { toast } = useToast();
  const [showModal, setShowModal] = useState(false);
  const [modalTab, setModalTab] = useState<'credits' | 'premium'>('credits');
  const [testResults, setTestResults] = useState<Record<string, boolean>>({});

  // Test service status
  const stripeStatus = stripePaymentService.getStatus();

  // Run connectivity tests
  const runConnectivityTest = async (testName: string, testFn: () => Promise<any>) => {
    try {
      await testFn();
      setTestResults(prev => ({ ...prev, [testName]: true }));
      toast({
        title: `✅ ${testName} Test Passed`,
        description: "Service is working correctly",
      });
    } catch (error) {
      setTestResults(prev => ({ ...prev, [testName]: false }));
      toast({
        title: `❌ ${testName} Test Failed`,
        description: error instanceof Error ? error.message : 'Test failed',
        variant: "destructive",
      });
    }
  };

  const testStripeService = () => runConnectivityTest('Stripe Service', async () => {
    if (!stripeStatus.configured) {
      throw new Error('Stripe publishable key not configured');
    }
    return true;
  });

  const testCreatePayment = () => runConnectivityTest('Payment Creation', async () => {
    const response = await fetch('/.netlify/functions/create-payment', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        amount: 1,
        productName: 'Test Product',
        credits: 1,
        isGuest: true,
        guestEmail: 'test@example.com',
        paymentMethod: 'stripe'
      })
    });
    
    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Unknown error' }));
      throw new Error(error.error || `HTTP ${response.status}`);
    }
    
    const result = await response.json();
    if (!result.url) {
      throw new Error('No payment URL returned');
    }
    
    return result;
  });

  const testCreateSubscription = () => runConnectivityTest('Subscription Creation', async () => {
    const response = await fetch('/.netlify/functions/create-subscription', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        plan: 'monthly',
        isGuest: true,
        guestEmail: 'test@example.com'
      })
    });
    
    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Unknown error' }));
      throw new Error(error.error || `HTTP ${response.status}`);
    }
    
    const result = await response.json();
    if (!result.url) {
      throw new Error('No subscription URL returned');
    }
    
    return result;
  });

  return (
    <div className="container mx-auto px-4 py-8 space-y-8">
      {/* Header */}
      <div className="text-center space-y-4">
        <h1 className="text-3xl font-bold">Stripe Payment Integration Test</h1>
        <p className="text-muted-foreground">
          Test all payment functionality including modals, direct checkout, and service connectivity
        </p>
      </div>

      {/* Service Status */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Service Configuration Status
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid md:grid-cols-2 gap-4">
            <div className="flex items-center justify-between">
              <span>Stripe Service</span>
              {stripeStatus.configured ? (
                <Badge className="bg-green-100 text-green-800">
                  <CheckCircle className="h-3 w-3 mr-1" />
                  Configured
                </Badge>
              ) : (
                <Badge variant="destructive">
                  <XCircle className="h-3 w-3 mr-1" />
                  Not Configured
                </Badge>
              )}
            </div>
            
            <div className="flex items-center justify-between">
              <span>Mode</span>
              <Badge variant="outline">{stripeStatus.mode}</Badge>
            </div>
          </div>

          <Separator />

          <div className="space-y-2">
            <h4 className="font-medium">Connectivity Tests</h4>
            <div className="flex flex-wrap gap-2">
              <Button onClick={testStripeService} size="sm" variant="outline">
                Test Stripe Service
                {testResults['Stripe Service'] !== undefined && (
                  testResults['Stripe Service'] ? 
                    <CheckCircle className="h-3 w-3 ml-1 text-green-600" /> :
                    <XCircle className="h-3 w-3 ml-1 text-red-600" />
                )}
              </Button>
              
              <Button onClick={testCreatePayment} size="sm" variant="outline">
                Test Payment Function
                {testResults['Payment Creation'] !== undefined && (
                  testResults['Payment Creation'] ? 
                    <CheckCircle className="h-3 w-3 ml-1 text-green-600" /> :
                    <XCircle className="h-3 w-3 ml-1 text-red-600" />
                )}
              </Button>
              
              <Button onClick={testCreateSubscription} size="sm" variant="outline">
                Test Subscription Function
                {testResults['Subscription Creation'] !== undefined && (
                  testResults['Subscription Creation'] ? 
                    <CheckCircle className="h-3 w-3 ml-1 text-green-600" /> :
                    <XCircle className="h-3 w-3 ml-1 text-red-600" />
                )}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Enhanced Payment Dashboard */}
      <PaymentDashboard />

      {/* Component Testing */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Premium Upgrade Buttons */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Crown className="h-5 w-5" />
              Premium Upgrade Components
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              <div>
                <h4 className="text-sm font-medium mb-2">Default Premium Button</h4>
                <PremiumUpgradeButton />
              </div>

              <div>
                <h4 className="text-sm font-medium mb-2">Header Upgrade Button</h4>
                <HeaderUpgradeButton />
              </div>

              <div>
                <h4 className="text-sm font-medium mb-2">Yearly Upgrade Button</h4>
                <YearlyUpgradeButton />
              </div>

              <div>
                <h4 className="text-sm font-medium mb-2">Quick Upgrade (No Modal)</h4>
                <PremiumUpgradeButton plan="yearly" quickUpgrade={true} showModal={false}>
                  <div className="flex items-center gap-2">
                    <Zap className="h-4 w-4" />
                    Quick Yearly Upgrade - $290
                  </div>
                </PremiumUpgradeButton>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Credit Purchase Buttons */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CreditCard className="h-5 w-5" />
              Credit Purchase Components
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              <div>
                <h4 className="text-sm font-medium mb-2">Default Buy Credits Button</h4>
                <BuyCreditsButton />
              </div>

              <div>
                <h4 className="text-sm font-medium mb-2">Quick Buy 100 Credits</h4>
                <QuickBuy100Button />
              </div>

              <div>
                <h4 className="text-sm font-medium mb-2">Custom Credits (250)</h4>
                <BuyCreditsButton credits={250} amount={350}>
                  Buy 250 Credits - $350
                </BuyCreditsButton>
              </div>

              <div>
                <h4 className="text-sm font-medium mb-2">Quick Buy (No Modal)</h4>
                <BuyCreditsButton 
                  credits={50} 
                  amount={70} 
                  quickBuy={true} 
                  showModal={false}
                >
                  <div className="flex items-center gap-2">
                    <Zap className="h-4 w-4" />
                    Quick Buy 50 Credits - $70
                  </div>
                </BuyCreditsButton>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Manual Modal Testing */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ExternalLink className="h-5 w-5" />
            Manual Modal Testing
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-3">
            <Button 
              onClick={() => { setModalTab('credits'); setShowModal(true); }}
              variant="outline"
            >
              Open Credits Modal
            </Button>
            
            <Button 
              onClick={() => { setModalTab('premium'); setShowModal(true); }}
              variant="outline"
            >
              Open Premium Modal
            </Button>
            
            <Button 
              onClick={() => { setModalTab('credits'); setShowModal(true); }}
              variant="outline"
            >
              Open with 100 Credits Pre-selected
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Security Notice */}
      <Card className="border-blue-200 bg-blue-50">
        <CardContent className="pt-6">
          <div className="flex items-center gap-3">
            <Shield className="h-5 w-5 text-blue-600" />
            <div>
              <h4 className="font-medium text-blue-900">Secure Payment Processing</h4>
              <p className="text-sm text-blue-700">
                All payments are processed securely by Stripe. Credit card information never touches our servers.
                Checkout opens in a new window for maximum security.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Payment Modal */}
      <ImprovedPaymentModal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        defaultTab={modalTab}
        initialCredits={modalTab === 'credits' ? 100 : undefined}
      />
    </div>
  );
}

export default StripeTestPage;
