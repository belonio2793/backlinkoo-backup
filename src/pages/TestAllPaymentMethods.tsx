import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CreditCard, TestTube, CheckCircle, AlertCircle, User } from 'lucide-react';
import { ModernCreditPurchaseModal } from '@/components/ModernCreditPurchaseModal';
import { BuyCreditsButton } from '@/components/BuyCreditsButton';
import { SimpleBuyCreditsButton } from '@/components/SimpleBuyCreditsButton';
import { UniversalPaymentComponent } from '@/components/UniversalPaymentComponent';
import { useAuth } from '@/hooks/useAuth';

export default function TestAllPaymentMethods() {
  const { user } = useAuth();
  const [modernModalOpen, setModernModalOpen] = useState(false);
  const [testResults, setTestResults] = useState<string[]>([]);

  const addTestResult = (result: string) => {
    setTestResults(prev => [...prev, `${new Date().toLocaleTimeString()}: ${result}`]);
  };

  const handlePaymentSuccess = (method: string) => {
    addTestResult(`✅ ${method} - Payment flow opened successfully`);
  };

  const handlePaymentError = (method: string, error: string) => {
    addTestResult(`❌ ${method} - Error: ${error}`);
  };

  const clearResults = () => {
    setTestResults([]);
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-6xl mx-auto px-4 space-y-8">
        {/* Header */}
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-bold flex items-center justify-center gap-2">
            <TestTube className="h-8 w-8" />
            Complete Payment Methods Test
          </h1>
          <p className="text-gray-600">
            Test all buy credit modals and buttons to ensure they work properly
          </p>
        </div>

        {/* User Status */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              User Status
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium">Authentication:</span>
                {user ? (
                  <Badge className="bg-green-100 text-green-800">{user.email}</Badge>
                ) : (
                  <Badge variant="outline">Not Authenticated</Badge>
                )}
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium">Environment:</span>
                <Badge variant="secondary">
                  {window.location.hostname === 'localhost' ? 'Development' : 'Production'}
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Test Results */}
        {testResults.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                Test Results
                <Button variant="outline" size="sm" onClick={clearResults}>
                  Clear Results
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {testResults.map((result, index) => (
                  <div key={index} className="text-sm font-mono bg-gray-100 p-2 rounded">
                    {result}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Payment Method Tests */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          
          {/* ModernCreditPurchaseModal Test */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CreditCard className="h-5 w-5" />
                ModernCreditPurchaseModal
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-gray-600">
                The main modal used in the header and updated to match your design.
              </p>
              <Button 
                onClick={() => setModernModalOpen(true)}
                className="w-full"
              >
                <CreditCard className="h-4 w-4 mr-2" />
                Test Modern Modal
              </Button>
            </CardContent>
          </Card>

          {/* BuyCreditsButton Test */}
          <Card>
            <CardHeader>
              <CardTitle>BuyCreditsButton Component</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-gray-600">
                Generic wrapper button that opens ModernCreditPurchaseModal.
              </p>
              <BuyCreditsButton
                onPaymentSuccess={() => handlePaymentSuccess('BuyCreditsButton')}
                onPaymentCancel={() => addTestResult('🔄 BuyCreditsButton - Payment cancelled')}
                userEmail={user?.email}
                isGuest={!user}
              />
            </CardContent>
          </Card>

          {/* SimpleBuyCreditsButton Test */}
          <Card>
            <CardHeader>
              <CardTitle>SimpleBuyCreditsButton</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-gray-600">
                Quick checkout button for specific credit amounts.
              </p>
              <div className="space-y-2">
                <SimpleBuyCreditsButton
                  defaultCredits={50}
                  onPaymentSuccess={() => handlePaymentSuccess('SimpleBuyCreditsButton (50)')}
                  onPaymentCancel={() => addTestResult('🔄 SimpleBuyCreditsButton (50) - Payment cancelled')}
                  guestEmail={user?.email || 'test@example.com'}
                  variant="outline"
                >
                  50 Credits - $70
                </SimpleBuyCreditsButton>
                
                <SimpleBuyCreditsButton
                  defaultCredits={100}
                  onPaymentSuccess={() => handlePaymentSuccess('SimpleBuyCreditsButton (100)')}
                  onPaymentCancel={() => addTestResult('🔄 SimpleBuyCreditsButton (100) - Payment cancelled')}
                  guestEmail={user?.email || 'test@example.com'}
                  variant="default"
                >
                  100 Credits - $140
                </SimpleBuyCreditsButton>
              </div>
            </CardContent>
          </Card>

          {/* UniversalPaymentComponent Test */}
          <Card>
            <CardHeader>
              <CardTitle>UniversalPaymentComponent</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-gray-600">
                Full-featured payment component with multiple options.
              </p>
              <UniversalPaymentComponent 
                defaultCredits={250}
                showTrigger={true}
                onPaymentSuccess={() => handlePaymentSuccess('UniversalPaymentComponent')}
              />
            </CardContent>
          </Card>

        </div>

        {/* ModernCreditPurchaseModal */}
        <ModernCreditPurchaseModal
          isOpen={modernModalOpen}
          onClose={() => setModernModalOpen(false)}
          onSuccess={() => {
            handlePaymentSuccess('ModernCreditPurchaseModal');
            setModernModalOpen(false);
          }}
        />

        {/* Instructions */}
        <Card>
          <CardHeader>
            <CardTitle>Testing Instructions</CardTitle>
          </CardHeader>
          <CardContent className="prose prose-sm max-w-none">
            <div className="space-y-4">
              <div>
                <h4 className="font-medium">Test Process:</h4>
                <ol className="list-decimal list-inside space-y-1 text-sm">
                  <li>Click each payment button/component above</li>
                  <li>Verify the modal opens correctly with the updated design</li>
                  <li>Test package selection and custom amount entry</li>
                  <li>Click the purchase button to initiate checkout</li>
                  <li>Verify Stripe checkout opens (or development mode message)</li>
                  <li>Check test results above for any errors</li>
                </ol>
              </div>
              
              <div>
                <h4 className="font-medium">What to Look For:</h4>
                <ul className="list-disc list-inside space-y-1 text-sm">
                  <li>No 404 errors in browser console</li>
                  <li>Modal opens with correct design and layout</li>
                  <li>Package selection works properly</li>
                  <li>Custom amount calculation is correct</li>
                  <li>Purchase button text updates dynamically</li>
                  <li>Checkout process initiates successfully</li>
                </ul>
              </div>

              <div>
                <h4 className="font-medium">Environment Info:</h4>
                <div className="text-sm space-y-1">
                  <div>Stripe Key: {import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY ? '✅ Configured' : '❌ Missing'}</div>
                  <div>Supabase Key: {import.meta.env.VITE_SUPABASE_ANON_KEY ? '✅ Configured' : '❌ Missing'}</div>
                  <div>Mode: {import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY?.startsWith('pk_test_') ? 'Test' : 
                            import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY?.startsWith('pk_live_') ? 'Live' : 'Unknown'}</div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

      </div>
    </div>
  );
}
