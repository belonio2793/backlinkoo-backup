import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { Crown, CheckCircle, AlertCircle, CreditCard, TestTube } from 'lucide-react';

// Import all the checkout modals to test
import { PremiumCheckoutModal } from '@/components/PremiumCheckoutModal';
import { TrialExhaustedModal } from '@/components/TrialExhaustedModal';
import { PremiumPlanModal } from '@/components/PremiumPlanModal';
import { GuestPremiumUpsellModal } from '@/components/GuestPremiumUpsellModal';
import { EnhancedPremiumCheckoutModal } from '@/components/EnhancedPremiumCheckoutModal';
import { StreamlinedPremiumCheckout } from '@/components/StreamlinedPremiumCheckout';

// Import services for direct testing
import SubscriptionService from '@/services/subscriptionService';
import { paymentIntegrationService } from '@/services/paymentIntegrationService';
import { CheckoutRedirectManager } from '@/utils/checkoutRedirectManager';
import { PopupBlockerDetection } from '@/utils/popupBlockerDetection';

export default function CheckoutTest() {
  const { toast } = useToast();
  const { user, isAuthenticated } = useAuth();
  
  // Modal states
  const [premiumCheckoutOpen, setPremiumCheckoutOpen] = useState(false);
  const [trialExhaustedOpen, setTrialExhaustedOpen] = useState(false);
  const [premiumPlanOpen, setPremiumPlanOpen] = useState(false);
  const [guestUpsellOpen, setGuestUpsellOpen] = useState(false);
  const [enhancedCheckoutOpen, setEnhancedCheckoutOpen] = useState(false);
  const [streamlinedCheckoutOpen, setStreamlinedCheckoutOpen] = useState(false);
  
  // Test states
  const [isTestingDirect, setIsTestingDirect] = useState(false);
  const [isTestingPopup, setIsTestingPopup] = useState(false);
  const [popupTestResult, setPopupTestResult] = useState<any>(null);

  // Test direct subscription creation
  const testDirectSubscription = async (plan: 'monthly' | 'yearly') => {
    setIsTestingDirect(true);
    try {
      toast({
        title: "Testing Direct Subscription",
        description: `Creating ${plan} subscription...`,
      });

      const result = await SubscriptionService.createSubscription(
        user,
        !user, // isGuest if no user
        !user ? 'test@example.com' : undefined,
        plan,
        {
          preferNewWindow: true,
          fallbackToCurrentWindow: true,
          onPopupBlocked: () => {
            toast({
              title: "Popup Blocked",
              description: "Fallback method activated",
            });
          },
          onRedirectSuccess: () => {
            toast({
              title: "✅ Checkout Opened",
              description: "Direct subscription test successful!",
            });
          },
          onRedirectError: (error) => {
            toast({
              title: "Redirect Error",
              description: error.message,
              variant: "destructive"
            });
          }
        }
      );

      if (result.success) {
        toast({
          title: "✅ Direct Test Success",
          description: `${plan} subscription checkout created successfully`,
        });
      } else {
        toast({
          title: "❌ Direct Test Failed",
          description: result.error || 'Unknown error',
          variant: "destructive"
        });
      }
    } catch (error) {
      toast({
        title: "❌ Direct Test Error",
        description: error instanceof Error ? error.message : 'Unknown error',
        variant: "destructive"
      });
    } finally {
      setIsTestingDirect(false);
    }
  };

  // Test popup blocker detection
  const testPopupDetection = async () => {
    setIsTestingPopup(true);
    try {
      const result = await PopupBlockerDetection.testPopupBlocking();
      setPopupTestResult(result);
      
      toast({
        title: "Popup Test Complete",
        description: `Blockers ${result.isBlocked ? 'detected' : 'not detected'} (${result.confidence} confidence)`,
        variant: result.isBlocked ? "destructive" : "default"
      });
    } catch (error) {
      toast({
        title: "Popup Test Error",
        description: error instanceof Error ? error.message : 'Unknown error',
        variant: "destructive"
      });
    } finally {
      setIsTestingPopup(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="flex items-center justify-center gap-3 mb-4">
            <TestTube className="h-8 w-8 text-blue-600" />
            <h1 className="text-3xl font-bold">Stripe Checkout Test Suite</h1>
          </div>
          <p className="text-gray-600">Test all checkout buttons and payment flows</p>
          <Badge variant="outline" className="mt-2">
            {isAuthenticated ? `Logged in as ${user?.email}` : 'Not logged in (guest mode)'}
          </Badge>
        </div>

        {/* System Status */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2">
                <CheckCircle className="h-5 w-5 text-green-600" />
                Checkout Manager
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-600">
                User gesture preservation and popup management active
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2">
                <AlertCircle className="h-5 w-5 text-blue-600" />
                Popup Detection
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Button 
                onClick={testPopupDetection}
                disabled={isTestingPopup}
                size="sm"
                variant="outline"
                className="w-full"
              >
                {isTestingPopup ? 'Testing...' : 'Test Popup Blockers'}
              </Button>
              {popupTestResult && (
                <div className="mt-2 text-xs">
                  <p className={`font-medium ${popupTestResult.isBlocked ? 'text-red-600' : 'text-green-600'}`}>
                    {popupTestResult.isBlocked ? 'Blocked' : 'Allowed'}
                  </p>
                  <p className="text-gray-500">
                    {popupTestResult.detectionMethod} ({popupTestResult.confidence})
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2">
                <CreditCard className="h-5 w-5 text-purple-600" />
                Payment Service
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-600">
                Subscription and payment integration services ready
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Direct API Tests */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Crown className="h-5 w-5" />
              Direct API Tests
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Button
                onClick={() => testDirectSubscription('monthly')}
                disabled={isTestingDirect}
                className="h-12"
              >
                {isTestingDirect ? 'Testing...' : 'Test Monthly Subscription'}
              </Button>
              <Button
                onClick={() => testDirectSubscription('yearly')}
                disabled={isTestingDirect}
                variant="outline"
                className="h-12"
              >
                {isTestingDirect ? 'Testing...' : 'Test Yearly Subscription'}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Modal Component Tests */}
        <Card>
          <CardHeader>
            <CardTitle>Modal Component Tests</CardTitle>
            <p className="text-sm text-gray-600">
              Test all premium checkout modals to ensure they open checkout properly
            </p>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <Button
                onClick={() => setPremiumCheckoutOpen(true)}
                variant="outline"
                className="h-12"
              >
                Premium Checkout Modal
              </Button>
              
              <Button
                onClick={() => setTrialExhaustedOpen(true)}
                variant="outline"
                className="h-12"
              >
                Trial Exhausted Modal
              </Button>
              
              <Button
                onClick={() => setPremiumPlanOpen(true)}
                variant="outline"
                className="h-12"
              >
                Premium Plan Modal
              </Button>
              
              <Button
                onClick={() => setGuestUpsellOpen(true)}
                variant="outline"
                className="h-12"
              >
                Guest Upsell Modal
              </Button>
              
              <Button
                onClick={() => setEnhancedCheckoutOpen(true)}
                variant="outline"
                className="h-12"
              >
                Enhanced Checkout Modal
              </Button>
              
              <Button
                onClick={() => setStreamlinedCheckoutOpen(true)}
                variant="outline"
                className="h-12"
              >
                Streamlined Checkout
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Instructions */}
        <div className="mt-8 p-6 bg-blue-50 rounded-lg">
          <h3 className="text-lg font-semibold mb-2 text-blue-900">Testing Instructions</h3>
          <ul className="text-sm text-blue-800 space-y-1">
            <li>1. First run popup detection to check your browser settings</li>
            <li>2. Test direct API calls to verify checkout URL generation</li>
            <li>3. Test each modal component to ensure they open Stripe checkout properly</li>
            <li>4. Verify that popup blockers are handled gracefully with fallbacks</li>
            <li>5. Check that checkout windows/tabs open successfully</li>
          </ul>
        </div>
      </div>

      {/* All the modals */}
      <PremiumCheckoutModal
        isOpen={premiumCheckoutOpen}
        onClose={() => setPremiumCheckoutOpen(false)}
        onSuccess={() => {
          toast({ title: "Premium Checkout Success!", description: "Modal test completed" });
        }}
      />

      <TrialExhaustedModal
        open={trialExhaustedOpen}
        onOpenChange={setTrialExhaustedOpen}
        guestResults={[]}
        totalLinks={5}
        isLoggedIn={isAuthenticated}
        userName={user?.email}
        onUpgrade={() => {
          toast({ title: "Trial Exhausted Success!", description: "Modal test completed" });
        }}
      />

      <PremiumPlanModal
        isOpen={premiumPlanOpen}
        onClose={() => setPremiumPlanOpen(false)}
        onSuccess={() => {
          toast({ title: "Premium Plan Success!", description: "Modal test completed" });
        }}
      />

      <GuestPremiumUpsellModal
        open={guestUpsellOpen}
        onOpenChange={setGuestUpsellOpen}
        onUpgrade={() => {
          toast({ title: "Guest Upsell Success!", description: "Modal test completed" });
        }}
      />

      <EnhancedPremiumCheckoutModal
        isOpen={enhancedCheckoutOpen}
        onClose={() => setEnhancedCheckoutOpen(false)}
        onSuccess={() => {
          toast({ title: "Enhanced Checkout Success!", description: "Modal test completed" });
        }}
      />

      <StreamlinedPremiumCheckout
        isOpen={streamlinedCheckoutOpen}
        onClose={() => setStreamlinedCheckoutOpen(false)}
        onSuccess={() => {
          toast({ title: "Streamlined Checkout Success!", description: "Modal test completed" });
        }}
      />
    </div>
  );
}
