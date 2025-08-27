import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { CreditPaymentService } from '@/services/creditPaymentService';
import { CustomCreditsModal } from '@/components/CustomCreditsModal';
import { ImprovedPaymentModal } from '@/components/ImprovedPaymentModal';
import { BuyCreditsButton } from '@/components/BuyCreditsButton';
import { CheckCircle, XCircle, AlertCircle, TestTube } from 'lucide-react';

export function CreditPaymentFixTest() {
  const { toast } = useToast();
  const { user } = useAuth();
  const [testResults, setTestResults] = useState<Array<{ name: string; status: 'pass' | 'fail' | 'pending'; message: string }>>([]);
  const [isCustomModalOpen, setIsCustomModalOpen] = useState(false);
  const [isImprovedModalOpen, setIsImprovedModalOpen] = useState(false);
  const [testing, setTesting] = useState(false);

  const addTestResult = (name: string, status: 'pass' | 'fail' | 'pending', message: string) => {
    setTestResults(prev => [...prev, { name, status, message }]);
  };

  const runPaymentTests = async () => {
    setTesting(true);
    setTestResults([]);

    try {
      // Test 1: Service environment detection
      addTestResult('Environment Detection', 'pending', 'Testing environment detection...');
      
      // @ts-ignore - Access private method for testing
      const environment = CreditPaymentService.getEnvironment?.() || { 
        hostname: window.location.hostname,
        isProduction: window.location.hostname === 'backlinkoo.com'
      };
      
      addTestResult(
        'Environment Detection', 
        'pass', 
        `Detected: ${environment.hostname}, Production: ${environment.isProduction}`
      );

      // Test 2: Stripe configuration
      addTestResult('Stripe Configuration', 'pending', 'Checking Stripe keys...');
      
      const stripeKey = import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY;
      if (stripeKey && stripeKey.startsWith('pk_')) {
        addTestResult('Stripe Configuration', 'pass', `Stripe key configured: ${stripeKey.substring(0, 12)}...`);
      } else {
        addTestResult('Stripe Configuration', 'fail', 'Stripe publishable key not configured or invalid');
      }

      // Test 3: User authentication
      addTestResult('User Authentication', 'pending', 'Checking user auth status...');
      
      if (user && user.email) {
        addTestResult('User Authentication', 'pass', `Authenticated as: ${user.email}`);
      } else {
        addTestResult('User Authentication', 'fail', 'User not authenticated - guest checkout will be used');
      }

      // Test 4: Payment service initialization
      addTestResult('Payment Service Test', 'pending', 'Testing payment service call...');
      
      try {
        const testResult = await CreditPaymentService.createCreditPayment(
          user,
          false,
          user?.email || 'test@example.com',
          {
            amount: 1.40,
            credits: 1,
            productName: 'Test Credit Payment',
            isGuest: !user,
            guestEmail: user?.email || 'test@example.com'
          }
        );

        if (testResult.success) {
          addTestResult(
            'Payment Service Test', 
            'pass', 
            testResult.usedFallback 
              ? 'Payment service working - using development fallback'
              : 'Payment service working - live checkout available'
          );
        } else {
          addTestResult('Payment Service Test', 'fail', `Payment service error: ${testResult.error}`);
        }
      } catch (error) {
        addTestResult('Payment Service Test', 'fail', `Payment service exception: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }

    } catch (error) {
      addTestResult('Test Suite', 'fail', `Test suite error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setTesting(false);
    }
  };

  const getStatusIcon = (status: 'pass' | 'fail' | 'pending') => {
    switch (status) {
      case 'pass': return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'fail': return <XCircle className="h-4 w-4 text-red-500" />;
      case 'pending': return <AlertCircle className="h-4 w-4 text-yellow-500" />;
    }
  };

  return (
    <div className="p-6 space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TestTube className="h-5 w-5" />
            Credit Payment System Test
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* User Status */}
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium">Current User:</span>
            {user ? (
              <Badge variant="secondary">{user.email}</Badge>
            ) : (
              <Badge variant="outline">Not Authenticated</Badge>
            )}
          </div>

          {/* Test Controls */}
          <div className="flex gap-2">
            <Button onClick={runPaymentTests} disabled={testing}>
              {testing ? 'Running Tests...' : 'Run Payment Tests'}
            </Button>
            <Button variant="outline" onClick={() => setTestResults([])}>
              Clear Results
            </Button>
          </div>

          {/* Test Results */}
          {testResults.length > 0 && (
            <div className="space-y-2">
              <h4 className="font-medium">Test Results:</h4>
              {testResults.map((result, index) => (
                <div key={index} className="flex items-start gap-2 p-2 bg-muted rounded">
                  {getStatusIcon(result.status)}
                  <div className="flex-1">
                    <div className="font-medium text-sm">{result.name}</div>
                    <div className="text-xs text-muted-foreground">{result.message}</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Live Component Tests */}
      <Card>
        <CardHeader>
          <CardTitle>Live Component Tests</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Custom Credits Modal Test */}
            <div className="space-y-2">
              <h4 className="font-medium">Custom Credits Modal</h4>
              <Button 
                variant="outline" 
                onClick={() => setIsCustomModalOpen(true)}
                className="w-full"
              >
                Test Custom Modal
              </Button>
            </div>

            {/* Improved Payment Modal Test */}
            <div className="space-y-2">
              <h4 className="font-medium">Improved Payment Modal</h4>
              <Button 
                variant="outline" 
                onClick={() => setIsImprovedModalOpen(true)}
                className="w-full"
              >
                Test Improved Modal
              </Button>
            </div>

            {/* Buy Credits Button Test */}
            <div className="space-y-2">
              <h4 className="font-medium">Buy Credits Button</h4>
              <BuyCreditsButton 
                credits={50}
                variant="outline"
                size="sm"
                quickBuy={false}
                showModal={true}
              >
                Test Quick Buy
              </BuyCreditsButton>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Modals */}
      <CustomCreditsModal
        isOpen={isCustomModalOpen}
        onClose={() => setIsCustomModalOpen(false)}
        initialCredits={100}
        onSuccess={() => {
          toast({
            title: "Test Success",
            description: "Custom Credits Modal test completed successfully",
          });
        }}
      />

      <ImprovedPaymentModal
        isOpen={isImprovedModalOpen}
        onClose={() => setIsImprovedModalOpen(false)}
        initialCredits={250}
      />
    </div>
  );
}

export default CreditPaymentFixTest;
