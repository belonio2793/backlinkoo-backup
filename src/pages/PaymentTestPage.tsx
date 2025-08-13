/**
 * Payment Test Page
 * Comprehensive testing page for payment functionality and mobile compatibility
 */

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Crown, 
  CreditCard, 
  Smartphone, 
  Monitor, 
  AlertCircle, 
  CheckCircle,
  Zap,
  Settings,
  TestTube
} from 'lucide-react';

import MobileOptimizedPaymentButton, { 
  QuickPremiumButton, 
  QuickCreditsButton, 
  MobilePaymentGrid 
} from '@/components/MobileOptimizedPaymentButton';
import PaymentDiagnostic from '@/components/PaymentDiagnostic';
import { PremiumPlanPopup } from '@/components/PremiumPlanPopup';
import { useToast } from '@/hooks/use-toast';

export function PaymentTestPage() {
  const [isMobile, setIsMobile] = useState(false);
  const [showPremiumModal, setShowPremiumModal] = useState(false);
  const [paymentResults, setPaymentResults] = useState<any[]>([]);
  const { toast } = useToast();

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth <= 768);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const handlePaymentSuccess = (type: string, details?: any) => {
    const result = {
      timestamp: new Date().toLocaleTimeString(),
      type,
      status: 'success',
      details
    };
    
    setPaymentResults(prev => [result, ...prev]);
    
    toast({
      title: "Payment Test Successful",
      description: `${type} payment flow initiated successfully`,
      variant: "default"
    });
  };

  const handlePaymentError = (type: string, error: string) => {
    const result = {
      timestamp: new Date().toLocaleTimeString(),
      type,
      status: 'error',
      error
    };
    
    setPaymentResults(prev => [result, ...prev]);
    
    toast({
      title: "Payment Test Failed",
      description: `${type}: ${error}`,
      variant: "destructive"
    });
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-6xl mx-auto px-4 space-y-8">
        {/* Header */}
        <div className="text-center space-y-4">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
            Payment System Test Page
          </h1>
          <div className="flex items-center justify-center gap-2">
            {isMobile ? (
              <Badge variant="outline" className="flex items-center gap-1">
                <Smartphone className="h-3 w-3" />
                Mobile View
              </Badge>
            ) : (
              <Badge variant="outline" className="flex items-center gap-1">
                <Monitor className="h-3 w-3" />
                Desktop View
              </Badge>
            )}
          </div>
        </div>

        {/* Status Alert */}
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            This page tests payment functionality and mobile compatibility. 
            No actual payments will be processed - all tests use development mode.
          </AlertDescription>
        </Alert>

        {/* Main Content */}
        <Tabs defaultValue="buttons" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="buttons">Payment Buttons</TabsTrigger>
            <TabsTrigger value="modal">Premium Modal</TabsTrigger>
            <TabsTrigger value="diagnostic">Diagnostics</TabsTrigger>
            <TabsTrigger value="results">Test Results</TabsTrigger>
          </TabsList>

          {/* Payment Buttons Tab */}
          <TabsContent value="buttons" className="space-y-6">
            <div className="grid gap-6 md:grid-cols-2">
              {/* Individual Button Tests */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <TestTube className="h-5 w-5" />
                    Individual Button Tests
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-3">
                    <h3 className="font-semibold">Premium Subscriptions</h3>
                    <MobileOptimizedPaymentButton
                      type="premium"
                      plan="monthly"
                      onSuccess={() => handlePaymentSuccess('Premium Monthly')}
                      onError={(error) => handlePaymentError('Premium Monthly', error)}
                    />
                    <MobileOptimizedPaymentButton
                      type="premium"
                      plan="yearly"
                      variant="outline"
                      onSuccess={() => handlePaymentSuccess('Premium Yearly')}
                      onError={(error) => handlePaymentError('Premium Yearly', error)}
                    />
                  </div>

                  <div className="space-y-3">
                    <h3 className="font-semibold">Credits Purchases</h3>
                    <div className="grid grid-cols-2 gap-2">
                      {[50, 100, 250, 500].map(credits => (
                        <MobileOptimizedPaymentButton
                          key={credits}
                          type="credits"
                          credits={credits}
                          variant="outline"
                          size="sm"
                          onSuccess={() => handlePaymentSuccess(`${credits} Credits`)}
                          onError={(error) => handlePaymentError(`${credits} Credits`, error)}
                        />
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Quick Action Tests */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Zap className="h-5 w-5" />
                    Quick Action Tests
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-3">
                    <h3 className="font-semibold">Quick Premium</h3>
                    <QuickPremiumButton 
                      plan="monthly"
                      onSuccess={() => handlePaymentSuccess('Quick Premium Monthly')}
                    />
                    <QuickPremiumButton 
                      plan="yearly"
                      className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700"
                      onSuccess={() => handlePaymentSuccess('Quick Premium Yearly')}
                    />
                  </div>

                  <div className="space-y-3">
                    <h3 className="font-semibold">Quick Credits</h3>
                    <div className="grid grid-cols-2 gap-2">
                      <QuickCreditsButton 
                        credits={50}
                        onSuccess={() => handlePaymentSuccess('Quick 50 Credits')}
                      />
                      <QuickCreditsButton 
                        credits={100}
                        onSuccess={() => handlePaymentSuccess('Quick 100 Credits')}
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Mobile Payment Grid */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Settings className="h-5 w-5" />
                  Mobile Payment Grid Test
                </CardTitle>
              </CardHeader>
              <CardContent>
                <MobilePaymentGrid 
                  onSuccess={(type) => handlePaymentSuccess(`Grid ${type}`)}
                />
              </CardContent>
            </Card>
          </TabsContent>

          {/* Premium Modal Tab */}
          <TabsContent value="modal" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Crown className="h-5 w-5" />
                  Premium Plan Modal Test
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-gray-600">
                  Test the full premium subscription flow with authentication and payment.
                </p>
                
                <Button 
                  onClick={() => setShowPremiumModal(true)}
                  className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
                  size="lg"
                >
                  <Crown className="h-5 w-5 mr-2" />
                  Open Premium Modal Test
                </Button>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
                  <div className="p-4 bg-blue-50 rounded-lg">
                    <h3 className="font-semibold text-blue-900 mb-2">Monthly Plan</h3>
                    <p className="text-2xl font-bold text-blue-700">$29/month</p>
                    <p className="text-sm text-blue-600">Perfect for individuals</p>
                  </div>
                  <div className="p-4 bg-green-50 rounded-lg">
                    <h3 className="font-semibold text-green-900 mb-2">Yearly Plan</h3>
                    <p className="text-2xl font-bold text-green-700">$290/year</p>
                    <p className="text-sm text-green-600">Save $298 per year!</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Diagnostics Tab */}
          <TabsContent value="diagnostic">
            <PaymentDiagnostic />
          </TabsContent>

          {/* Test Results Tab */}
          <TabsContent value="results" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CheckCircle className="h-5 w-5" />
                  Payment Test Results
                </CardTitle>
              </CardHeader>
              <CardContent>
                {paymentResults.length === 0 ? (
                  <p className="text-center text-gray-500 py-8">
                    No test results yet. Try some payment buttons to see results here.
                  </p>
                ) : (
                  <div className="space-y-3">
                    {paymentResults.map((result, index) => (
                      <div 
                        key={index}
                        className={`p-3 rounded-lg border ${
                          result.status === 'success' ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            {result.status === 'success' ? (
                              <CheckCircle className="h-4 w-4 text-green-500" />
                            ) : (
                              <AlertCircle className="h-4 w-4 text-red-500" />
                            )}
                            <span className="font-medium">{result.type}</span>
                            <Badge variant={result.status === 'success' ? 'default' : 'destructive'}>
                              {result.status}
                            </Badge>
                          </div>
                          <span className="text-sm text-gray-500">{result.timestamp}</span>
                        </div>
                        {result.error && (
                          <p className="text-sm text-red-600 mt-1">{result.error}</p>
                        )}
                        {result.details && (
                          <pre className="text-xs bg-gray-100 p-2 rounded mt-2 overflow-auto">
                            {JSON.stringify(result.details, null, 2)}
                          </pre>
                        )}
                      </div>
                    ))}
                    
                    <Button 
                      variant="outline" 
                      onClick={() => setPaymentResults([])}
                      className="w-full mt-4"
                    >
                      Clear Results
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Premium Modal */}
        <PremiumPlanPopup
          isOpen={showPremiumModal}
          onClose={() => setShowPremiumModal(false)}
          onSuccess={() => {
            handlePaymentSuccess('Premium Modal');
            setShowPremiumModal(false);
          }}
        />
      </div>
    </div>
  );
}

export default PaymentTestPage;
