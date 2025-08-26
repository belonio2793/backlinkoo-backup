import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { UniversalPaymentComponent } from '@/components/UniversalPaymentComponent';
import { PremiumCheckoutModal } from '@/components/PremiumCheckoutModal';
import { PricingModal } from '@/components/PricingModal';
import { EnhancedUnifiedPaymentModal } from '@/components/EnhancedUnifiedPaymentModal';
import { stripeCheckout } from '@/services/universalStripeCheckout';
import { paymentIntegrationService } from '@/services/paymentIntegrationService';
import { paymentConfigService } from '@/services/paymentConfigService';
import { 
  CreditCard, 
  Crown, 
  Settings, 
  CheckCircle, 
  AlertCircle,
  TestTube,
  Zap,
  Shield,
  ExternalLink
} from 'lucide-react';

export default function PaymentSystemTest() {
  const { toast } = useToast();
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [configTest, setConfigTest] = useState<any>(null);
  
  // Modal states
  const [showUniversalModal, setShowUniversalModal] = useState(false);
  const [showPremiumModal, setShowPremiumModal] = useState(false);
  const [showPricingModal, setShowPricingModal] = useState(false);
  const [showEnhancedModal, setShowEnhancedModal] = useState(false);

  const testStripeConfiguration = async () => {
    setLoading(true);
    try {
      // Test payment configuration
      const configResult = paymentConfigService.validateConfiguration();
      const integrationStatus = paymentIntegrationService.getConfigurationStatus();
      const stripeTest = await stripeCheckout.testConfiguration();
      
      setConfigTest({
        config: configResult,
        integration: integrationStatus,
        stripe: stripeTest
      });

      toast({
        title: "Configuration Test Complete",
        description: "Check the results below for detailed status",
      });
    } catch (error) {
      toast({
        title: "Test Failed",
        description: error instanceof Error ? error.message : "Configuration test failed",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const testQuickPurchase = async (credits: number) => {
    try {
      const result = await stripeCheckout.quickBuyCredits(credits);
      if (!result.success) {
        throw new Error(result.error || 'Purchase failed');
      }
      toast({
        title: 'Test Purchase Initiated',
        description: 'Stripe checkout should open in a new window',
      });
    } catch (error) {
      toast({
        title: 'Purchase Test Failed',
        description: error instanceof Error ? error.message : 'Test purchase failed',
        variant: 'destructive'
      });
    }
  };

  const testPremiumUpgrade = async (plan: 'monthly' | 'yearly') => {
    try {
      const result = await stripeCheckout.upgradeToPremium(plan);
      if (!result.success) {
        throw new Error(result.error || 'Upgrade failed');
      }
      toast({
        title: 'Test Upgrade Initiated',
        description: 'Stripe checkout should open in a new window',
      });
    } catch (error) {
      toast({
        title: 'Upgrade Test Failed',
        description: error instanceof Error ? error.message : 'Test upgrade failed',
        variant: 'destructive'
      });
    }
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      <div className="space-y-8">
        {/* Header */}
        <div className="text-center space-y-4">
          <h1 className="text-3xl font-bold flex items-center justify-center gap-3">
            <TestTube className="h-8 w-8 text-blue-600" />
            Payment System Test Suite
          </h1>
          <p className="text-muted-foreground">
            Test all payment modals, checkout flows, and Stripe integration
          </p>
          {user && (
            <Badge variant="outline" className="bg-green-50 text-green-700 border-green-300">
              <CheckCircle className="w-4 h-4 mr-1" />
              Signed in as {user.email}
            </Badge>
          )}
        </div>

        {/* Configuration Test */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="h-5 w-5" />
              Configuration Test
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button 
              onClick={testStripeConfiguration} 
              disabled={loading}
              className="w-full"
            >
              {loading ? 'Testing...' : 'Test Stripe Configuration'}
            </Button>

            {configTest && (
              <div className="space-y-4 mt-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {/* Payment Config */}
                  <Card className={`border-2 ${configTest.config.success ? 'border-green-300 bg-green-50' : 'border-red-300 bg-red-50'}`}>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm flex items-center gap-2">
                        {configTest.config.success ? (
                          <CheckCircle className="h-4 w-4 text-green-600" />
                        ) : (
                          <AlertCircle className="h-4 w-4 text-red-600" />
                        )}
                        Payment Config
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-xs">{configTest.config.message}</p>
                      {configTest.config.missingVars && (
                        <div className="mt-2">
                          <p className="text-xs font-medium">Missing:</p>
                          <ul className="text-xs text-red-600">
                            {configTest.config.missingVars.map((v: string) => (
                              <li key={v}>• {v}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </CardContent>
                  </Card>

                  {/* Integration Status */}
                  <Card className={`border-2 ${configTest.integration.isConfigured ? 'border-green-300 bg-green-50' : 'border-yellow-300 bg-yellow-50'}`}>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm flex items-center gap-2">
                        {configTest.integration.isConfigured ? (
                          <CheckCircle className="h-4 w-4 text-green-600" />
                        ) : (
                          <AlertCircle className="h-4 w-4 text-yellow-600" />
                        )}
                        Integration
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-xs">Available: {configTest.integration.availableMethods.join(', ') || 'None'}</p>
                      <p className="text-xs">Environment: {configTest.integration.environment}</p>
                      <p className="text-xs">Stripe Enabled: {configTest.integration.stripe.enabled ? 'Yes' : 'No'}</p>
                    </CardContent>
                  </Card>

                  {/* Stripe Test */}
                  <Card className={`border-2 ${configTest.stripe.configured ? 'border-green-300 bg-green-50' : 'border-red-300 bg-red-50'}`}>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm flex items-center gap-2">
                        {configTest.stripe.configured ? (
                          <CheckCircle className="h-4 w-4 text-green-600" />
                        ) : (
                          <AlertCircle className="h-4 w-4 text-red-600" />
                        )}
                        Stripe API
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-xs">
                        {configTest.stripe.configured ? 'API Connected' : configTest.stripe.error}
                      </p>
                    </CardContent>
                  </Card>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Quick Tests */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Zap className="h-5 w-5" />
              Quick Checkout Tests
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <Button 
                onClick={() => testQuickPurchase(100)}
                variant="outline"
                className="flex items-center gap-2"
              >
                <CreditCard className="h-4 w-4" />
                Test 100 Credits ($140)
              </Button>
              <Button 
                onClick={() => testQuickPurchase(250)}
                variant="outline"
                className="flex items-center gap-2"
              >
                <CreditCard className="h-4 w-4" />
                Test 250 Credits ($350)
              </Button>
              <Button 
                onClick={() => testPremiumUpgrade('monthly')}
                variant="outline"
                className="flex items-center gap-2"
              >
                <Crown className="h-4 w-4" />
                Test Monthly ($29)
              </Button>
              <Button 
                onClick={() => testPremiumUpgrade('yearly')}
                variant="outline"
                className="flex items-center gap-2"
              >
                <Crown className="h-4 w-4" />
                Test Yearly ($290)
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Modal Tests */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ExternalLink className="h-5 w-5" />
              Payment Modal Tests
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <Button 
                onClick={() => setShowUniversalModal(true)}
                className="flex items-center gap-2"
              >
                <CreditCard className="h-4 w-4" />
                Universal Payment
              </Button>
              <Button 
                onClick={() => setShowEnhancedModal(true)}
                className="flex items-center gap-2"
              >
                <Zap className="h-4 w-4" />
                Enhanced Unified
              </Button>
              <Button 
                onClick={() => setShowPremiumModal(true)}
                className="flex items-center gap-2"
              >
                <Crown className="h-4 w-4" />
                Premium Checkout
              </Button>
              <Button 
                onClick={() => setShowPricingModal(true)}
                className="flex items-center gap-2"
              >
                <Shield className="h-4 w-4" />
                Pricing Modal
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Test Instructions */}
        <Card>
          <CardHeader>
            <CardTitle>Test Instructions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <h4 className="font-medium">✅ What to Test:</h4>
              <ul className="text-sm space-y-1 ml-4">
                <li>• Configuration test shows all green statuses</li>
                <li>• Quick checkout tests open Stripe in new window</li>
                <li>• All payment modals open and function correctly</li>
                <li>• Checkout completes successfully (use Stripe test cards)</li>
                <li>• Success/cancel callbacks work properly</li>
              </ul>
            </div>
            
            <div className="space-y-2">
              <h4 className="font-medium">🔧 Stripe Test Cards:</h4>
              <ul className="text-sm space-y-1 ml-4">
                <li>• Success: 4242 4242 4242 4242</li>
                <li>• Declined: 4000 0000 0000 0002</li>
                <li>• 3D Secure: 4000 0025 0000 3155</li>
                <li>• Use any future expiry date and any 3-digit CVC</li>
              </ul>
            </div>

            <div className="space-y-2">
              <h4 className="font-medium">⚠️ Expected Behavior:</h4>
              <ul className="text-sm space-y-1 ml-4">
                <li>• Modals should open without errors</li>
                <li>• Stripe checkout opens in new window/tab</li>
                <li>• Payment completion triggers success events</li>
                <li>• Credits/subscriptions are processed correctly</li>
              </ul>
            </div>
          </CardContent>
        </Card>

        {/* Payment Modals */}
        <UniversalPaymentComponent 
          showTrigger={false}
          trigger={<div />}
          defaultType="credits"
          defaultCredits={100}
        />

        <EnhancedUnifiedPaymentModal
          isOpen={showEnhancedModal}
          onClose={() => setShowEnhancedModal(false)}
          defaultTab="credits"
        />

        <PremiumCheckoutModal
          isOpen={showPremiumModal}
          onClose={() => setShowPremiumModal(false)}
        />

        <PricingModal
          isOpen={showPricingModal}
          onClose={() => setShowPricingModal(false)}
          initialCredits={200}
        />
      </div>
    </div>
  );
}
