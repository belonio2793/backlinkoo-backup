import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { CreditCard, CheckCircle, AlertTriangle, User, UserX } from 'lucide-react';
import { useAuthState } from '@/hooks/useAuthState';
import { BuyCreditsButton } from '@/components/BuyCreditsButton';
import { CustomCreditsModal } from '@/components/CustomCreditsModal';
import { PaymentModal } from '@/components/PaymentModal';
import { DirectBuyCreditsButton } from '@/components/DirectPaymentButtons';

/**
 * Payment Flow Test Component
 * Tests all credit purchase flows with proper email handling
 */
export function PaymentFlowTest() {
  const { user, isLoading: authLoading } = useAuthState();
  const [testResults, setTestResults] = useState<Array<{
    test: string;
    status: 'pending' | 'success' | 'error';
    message: string;
  }>>([]);
  
  const [showCustomModal, setShowCustomModal] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  
  const addTestResult = (test: string, status: 'success' | 'error', message: string) => {
    setTestResults(prev => [...prev, { test, status, message }]);
  };

  const clearResults = () => {
    setTestResults([]);
  };

  return (
    <div className="space-y-6 p-6 max-w-4xl mx-auto">
      <div className="text-center">
        <h1 className="text-2xl font-bold mb-2">Payment Flow Test Dashboard</h1>
        <p className="text-gray-600">Test all credit purchase flows with proper email handling</p>
      </div>

      {/* Authentication Status */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            {user ? <User className="h-5 w-5" /> : <UserX className="h-5 w-5" />}
            Authentication Status
          </CardTitle>
        </CardHeader>
        <CardContent>
          {authLoading ? (
            <Badge variant="secondary">Checking...</Badge>
          ) : user ? (
            <div className="space-y-2">
              <Badge variant="default" className="bg-green-100 text-green-800 border-green-300">
                ✅ Authenticated
              </Badge>
              <p className="text-sm text-gray-600">
                Logged in as: <span className="font-medium">{user.email}</span>
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              <Badge variant="secondary" className="bg-yellow-100 text-yellow-800 border-yellow-300">
                ⚠️ Guest User
              </Badge>
              <p className="text-sm text-gray-600">
                Payment flows will prompt for email
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Test Results */}
      {testResults.length > 0 && (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Test Results</CardTitle>
            <Button variant="outline" size="sm" onClick={clearResults}>
              Clear Results
            </Button>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {testResults.map((result, index) => (
                <Alert key={index} variant={result.status === 'error' ? 'destructive' : 'default'}>
                  <div className="flex items-center gap-2">
                    {result.status === 'success' ? (
                      <CheckCircle className="h-4 w-4 text-green-600" />
                    ) : (
                      <AlertTriangle className="h-4 w-4" />
                    )}
                    <div>
                      <div className="font-medium">{result.test}</div>
                      <AlertDescription>{result.message}</AlertDescription>
                    </div>
                  </div>
                </Alert>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Payment Flow Tests */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* BuyCreditsButton Test */}
        <Card>
          <CardHeader>
            <CardTitle>BuyCreditsButton</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-sm text-gray-600">
              Tests the main BuyCreditsButton component with proper email handling
            </p>
            
            <BuyCreditsButton
              credits={50}
              amount={70}
              variant="default"
              quickBuy={true}
              showModal={false}
            >
              Test Buy 50 Credits - $70
            </BuyCreditsButton>
            
            <BuyCreditsButton
              credits={100}
              variant="outline"
            >
              Test Buy 100 Credits (Modal)
            </BuyCreditsButton>
          </CardContent>
        </Card>

        {/* DirectPaymentButtons Test */}
        <Card>
          <CardHeader>
            <CardTitle>DirectPaymentButtons</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-sm text-gray-600">
              Tests direct payment buttons with auto email collection
            </p>
            
            <DirectBuyCreditsButton
              credits={50}
              variant="default"
            />
            
            <DirectBuyCreditsButton
              credits={100}
              variant="outline"
            />
          </CardContent>
        </Card>

        {/* Custom Modal Test */}
        <Card>
          <CardHeader>
            <CardTitle>CustomCreditsModal</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-sm text-gray-600">
              Tests the enhanced custom credits modal
            </p>
            
            <Button onClick={() => setShowCustomModal(true)}>
              Open Custom Credits Modal
            </Button>
          </CardContent>
        </Card>

        {/* Payment Modal Test */}
        <Card>
          <CardHeader>
            <CardTitle>PaymentModal</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-sm text-gray-600">
              Tests the standard payment modal with guest/user handling
            </p>
            
            <Button onClick={() => setShowPaymentModal(true)} variant="outline">
              Open Payment Modal
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Function Status Test */}
      <Card>
        <CardHeader>
          <CardTitle>Netlify Functions Status</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <Button 
              onClick={async () => {
                try {
                  const response = await fetch('/.netlify/functions/create-payment', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                      amount: 1,
                      credits: 1,
                      productName: 'Test',
                      isGuest: true,
                      guestEmail: 'test@example.com',
                      paymentMethod: 'stripe'
                    })
                  });
                  
                  if (response.ok) {
                    addTestResult('create-payment', 'success', 'Function responded successfully');
                  } else {
                    addTestResult('create-payment', 'error', `HTTP ${response.status}: ${response.statusText}`);
                  }
                } catch (error) {
                  addTestResult('create-payment', 'error', `Network error: ${error}`);
                }
              }}
              variant="outline"
            >
              Test create-payment Function
            </Button>
            
            <Button 
              onClick={async () => {
                try {
                  const response = await fetch('/.netlify/functions/verify-payment?session_id=test');
                  
                  if (response.ok) {
                    addTestResult('verify-payment', 'success', 'Function responded successfully');
                  } else {
                    addTestResult('verify-payment', 'error', `HTTP ${response.status}: ${response.statusText}`);
                  }
                } catch (error) {
                  addTestResult('verify-payment', 'error', `Network error: ${error}`);
                }
              }}
              variant="outline"
            >
              Test verify-payment Function
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Modals */}
      <CustomCreditsModal
        isOpen={showCustomModal}
        onClose={() => setShowCustomModal(false)}
        initialCredits={250}
        onSuccess={() => {
          addTestResult('CustomCreditsModal', 'success', 'Modal opened checkout successfully');
          setShowCustomModal(false);
        }}
      />

      <PaymentModal
        isOpen={showPaymentModal}
        onClose={() => setShowPaymentModal(false)}
        initialCredits={100}
      />
    </div>
  );
}

export default PaymentFlowTest;
