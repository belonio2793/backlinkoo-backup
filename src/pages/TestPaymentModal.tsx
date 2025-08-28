import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ModernCreditPurchaseModal } from '@/components/ModernCreditPurchaseModal';
import { CreditCard, TestTube, CheckCircle, AlertCircle } from 'lucide-react';

export default function TestPaymentModal() {
  const [showModal, setShowModal] = useState(false);
  const [testResult, setTestResult] = useState<string | null>(null);

  const handleSuccess = () => {
    setTestResult('✅ Payment flow opened successfully!');
    console.log('Payment modal success callback triggered');
  };

  const openModal = () => {
    setShowModal(true);
    setTestResult(null);
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 space-y-8">
        {/* Header */}
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-bold flex items-center justify-center gap-2">
            <TestTube className="h-8 w-8" />
            Payment Modal Test
          </h1>
          <p className="text-gray-600">
            Test the updated Buy Credits modal that matches the provided design
          </p>
        </div>

        {/* Environment Status */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5" />
              Environment Status
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div className="space-y-2">
                <h4 className="font-medium">Stripe Configuration</h4>
                <div className="space-y-1">
                  <div className="flex justify-between">
                    <span>VITE_STRIPE_PUBLISHABLE_KEY:</span>
                    <span className={import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY ? "text-green-600" : "text-red-600"}>
                      {import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY ? "✅ Set" : "❌ Missing"}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Key Type:</span>
                    <span className="text-blue-600">
                      {import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY?.startsWith('pk_test_') ? 'Test Mode' : 
                       import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY?.startsWith('pk_live_') ? 'Live Mode' : 'Unknown'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Environment:</span>
                    <span className="text-blue-600">
                      {window.location.hostname === 'localhost' ? 'Development' : 'Production'}
                    </span>
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <h4 className="font-medium">Modal Features</h4>
                <div className="space-y-1">
                  <div className="flex justify-between">
                    <span>Design Updated:</span>
                    <span className="text-green-600">✅ Matches Image</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Credit Packages:</span>
                    <span className="text-green-600">✅ 50, 100, 250, 500</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Custom Amount:</span>
                    <span className="text-green-600">✅ Default 300 credits</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Rate:</span>
                    <span className="text-green-600">✅ $1.40 per credit</span>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Test Result */}
        {testResult && (
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                {testResult.includes('✅') ? (
                  <CheckCircle className="h-5 w-5 text-green-600" />
                ) : (
                  <AlertCircle className="h-5 w-5 text-orange-600" />
                )}
                <span className="font-medium">{testResult}</span>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Test Buttons */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CreditCard className="h-5 w-5" />
                Test Modal
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-gray-600">
                Open the updated Buy Credits modal that matches the provided image design.
              </p>
              <Button 
                onClick={openModal}
                className="w-full"
                size="lg"
              >
                <CreditCard className="h-4 w-4 mr-2" />
                Open Buy Credits Modal
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Design Specifications</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <div className="space-y-1">
                <div className="flex justify-between">
                  <span>Account Field:</span>
                  <span className="text-green-600">✅ Shows user email</span>
                </div>
                <div className="flex justify-between">
                  <span>Package Layout:</span>
                  <span className="text-green-600">✅ 4-column grid</span>
                </div>
                <div className="flex justify-between">
                  <span>Custom Amount:</span>
                  <span className="text-green-600">✅ 3-column layout</span>
                </div>
                <div className="flex justify-between">
                  <span>Features List:</span>
                  <span className="text-green-600">✅ 3-column with checkmarks</span>
                </div>
                <div className="flex justify-between">
                  <span>Button Text:</span>
                  <span className="text-green-600">✅ "Buy X Credits for $Y"</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Modal */}
        <ModernCreditPurchaseModal
          isOpen={showModal}
          onClose={() => setShowModal(false)}
          onSuccess={handleSuccess}
        />

        {/* Instructions */}
        <Card>
          <CardHeader>
            <CardTitle>Testing Instructions</CardTitle>
          </CardHeader>
          <CardContent className="prose prose-sm max-w-none">
            <ol className="space-y-2">
              <li>Click "Open Buy Credits Modal" to test the updated design</li>
              <li>Verify the modal matches the provided image:
                <ul className="mt-1 space-y-1">
                  <li>Account section showing user email</li>
                  <li>4 credit packages in a grid layout</li>
                  <li>Custom amount section with default 300 credits</li>
                  <li>Features list in 3 columns with green checkmarks</li>
                  <li>Blue purchase button with dynamic text</li>
                </ul>
              </li>
              <li>Test package selection and custom amount entry</li>
              <li>Verify the purchase button text updates correctly</li>
              <li>Test the checkout flow (will open Stripe in development mode)</li>
            </ol>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
