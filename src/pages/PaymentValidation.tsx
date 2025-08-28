import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { PricingModal } from '@/components/PricingModal';
import { PaymentModal } from '@/components/PaymentModal';
import { EnhancedUnifiedPaymentModal } from '@/components/EnhancedUnifiedPaymentModal';
import { 
  CheckCircle, 
  XCircle, 
  Clock, 
  CreditCard, 
  Crown,
  TestTube,
  AlertCircle
} from 'lucide-react';

export default function PaymentValidation() {
  const [showPricingModal, setShowPricingModal] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showEnhancedModal, setShowEnhancedModal] = useState(false);
  const [enhancedModalTab, setEnhancedModalTab] = useState<'credits' | 'premium'>('credits');
  const [testResults, setTestResults] = useState<any[]>([]);
  const { toast } = useToast();

  const addTestResult = (test: string, status: 'success' | 'error' | 'info', message: string) => {
    const result = {
      id: Date.now(),
      test,
      status,
      message,
      timestamp: new Date().toLocaleTimeString()
    };
    setTestResults(prev => [result, ...prev]);
    
    toast({
      title: `${test} - ${status}`,
      description: message,
      variant: status === 'error' ? 'destructive' : 'default'
    });
  };

  const testPricingModal = () => {
    addTestResult('PricingModal', 'info', 'Opening PricingModal...');
    setShowPricingModal(true);
  };

  const testPaymentModal = () => {
    addTestResult('PaymentModal', 'info', 'Opening PaymentModal...');
    setShowPaymentModal(true);
  };

  const testEnhancedModal = (tab: 'credits' | 'premium') => {
    addTestResult('EnhancedUnifiedPaymentModal', 'info', `Opening EnhancedModal with ${tab} tab...`);
    setEnhancedModalTab(tab);
    setShowEnhancedModal(true);
  };

  const handleModalSuccess = (modalType: string) => {
    addTestResult(modalType, 'success', 'Payment flow initiated successfully');
  };

  const handleModalError = (modalType: string, error: string) => {
    addTestResult(modalType, 'error', `Error: ${error}`);
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 space-y-8">
        
        {/* Header */}
        <div className="text-center space-y-4">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
            Payment System Validation
          </h1>
          <p className="text-gray-600 max-w-2xl mx-auto">
            Test all payment modals and verify the fixes for "Failed to create payment session" errors.
            All tests use development mode - no actual payments will be processed.
          </p>
        </div>

        {/* Test Controls */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TestTube className="h-5 w-5" />
              Payment Modal Tests
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            
            {/* PricingModal Test */}
            <div className="space-y-3">
              <h3 className="font-semibold">PricingModal.tsx</h3>
              <p className="text-sm text-gray-600">
                Tests the main pricing modal with credit packages and custom amounts
              </p>
              <Button 
                onClick={testPricingModal}
                className="w-full md:w-auto"
                variant="outline"
              >
                <CreditCard className="h-4 w-4 mr-2" />
                Test Pricing Modal
              </Button>
            </div>

            {/* PaymentModal Test */}
            <div className="space-y-3">
              <h3 className="font-semibold">PaymentModal.tsx</h3>
              <p className="text-sm text-gray-600">
                Tests the simple payment modal for credit purchases and subscriptions
              </p>
              <Button 
                onClick={testPaymentModal}
                className="w-full md:w-auto"
                variant="outline"
              >
                <CreditCard className="h-4 w-4 mr-2" />
                Test Payment Modal
              </Button>
            </div>

            {/* EnhancedUnifiedPaymentModal Tests */}
            <div className="space-y-3">
              <h3 className="font-semibold">EnhancedUnifiedPaymentModal.tsx</h3>
              <p className="text-sm text-gray-600">
                Tests the main unified payment modal with both credit and premium flows
              </p>
              <div className="flex flex-wrap gap-2">
                <Button 
                  onClick={() => testEnhancedModal('credits')}
                  className="flex-1 md:flex-none"
                  variant="outline"
                >
                  <CreditCard className="h-4 w-4 mr-2" />
                  Test Credits Tab
                </Button>
                <Button 
                  onClick={() => testEnhancedModal('premium')}
                  className="flex-1 md:flex-none"
                  variant="outline"
                >
                  <Crown className="h-4 w-4 mr-2" />
                  Test Premium Tab
                </Button>
              </div>
            </div>

          </CardContent>
        </Card>

        {/* Test Results */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5" />
              Test Results
            </CardTitle>
          </CardHeader>
          <CardContent>
            {testResults.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <AlertCircle className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p>No tests run yet. Click the test buttons above to start validation.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {testResults.map((result) => (
                  <div 
                    key={result.id}
                    className={`p-3 rounded-lg border ${
                      result.status === 'success' ? 'bg-green-50 border-green-200' : 
                      result.status === 'error' ? 'bg-red-50 border-red-200' :
                      'bg-blue-50 border-blue-200'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        {result.status === 'success' && <CheckCircle className="h-4 w-4 text-green-500" />}
                        {result.status === 'error' && <XCircle className="h-4 w-4 text-red-500" />}
                        {result.status === 'info' && <Clock className="h-4 w-4 text-blue-500" />}
                        <span className="font-medium">{result.test}</span>
                        <Badge variant={
                          result.status === 'success' ? 'default' : 
                          result.status === 'error' ? 'destructive' : 
                          'secondary'
                        }>
                          {result.status}
                        </Badge>
                      </div>
                      <span className="text-sm text-gray-500">{result.timestamp}</span>
                    </div>
                    <p className="text-sm mt-1">{result.message}</p>
                  </div>
                ))}
                
                <Button 
                  variant="outline" 
                  onClick={() => setTestResults([])}
                  className="w-full mt-4"
                >
                  Clear Results
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Payment Modals */}
        <PricingModal
          isOpen={showPricingModal}
          onClose={() => {
            setShowPricingModal(false);
            addTestResult('PricingModal', 'info', 'Modal closed');
          }}
          onAuthSuccess={() => handleModalSuccess('PricingModal')}
        />

        <PaymentModal
          isOpen={showPaymentModal}
          onClose={() => {
            setShowPaymentModal(false);
            addTestResult('PaymentModal', 'info', 'Modal closed');
          }}
        />

        <EnhancedUnifiedPaymentModal
          isOpen={showEnhancedModal}
          onClose={() => {
            setShowEnhancedModal(false);
            addTestResult('EnhancedUnifiedPaymentModal', 'info', 'Modal closed');
          }}
          defaultTab={enhancedModalTab}
          onSuccess={() => handleModalSuccess('EnhancedUnifiedPaymentModal')}
        />

      </div>
    </div>
  );
}
