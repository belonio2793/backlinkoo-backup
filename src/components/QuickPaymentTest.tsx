import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { CreditPaymentService } from '@/services/creditPaymentService';
import { CreditCard, TestTube, CheckCircle, XCircle } from 'lucide-react';

export function QuickPaymentTest() {
  const { toast } = useToast();
  const [isTestingPayment, setIsTestingPayment] = useState(false);
  const [lastTestResult, setLastTestResult] = useState<any>(null);

  const testCreditPurchase = async (credits: number, amount: number) => {
    setIsTestingPayment(true);
    setLastTestResult(null);

    try {
      console.log(`🧪 Testing credit purchase: ${credits} credits for $${amount}`);
      
      const result = await CreditPaymentService.createCreditPayment(
        null, // No user (guest mode)
        true, // Is guest
        'test@backlinkoo.com',
        {
          amount,
          credits,
          productName: `Test ${credits} Credits`
        }
      );

      console.log('🔍 Test result:', result);
      setLastTestResult(result);

      if (result.success) {
        toast({
          title: "✅ Payment Test Successful",
          description: result.usedFallback ? 
            "Development checkout would open in new window" :
            "Stripe checkout would open in new window",
        });

        // If we got a URL, try to open it in a popup for testing
        if (result.url) {
          console.log('🪟 Would open checkout window:', result.url);
          
          // For development, let's actually open the window to test
          const testWindow = window.open(
            result.url,
            'test-checkout',
            'width=800,height=600,scrollbars=yes,resizable=yes'
          );
          
          if (!testWindow) {
            toast({
              title: "Popup Blocked",
              description: "Please allow popups to test the checkout window.",
              variant: "destructive"
            });
          }
        }
      } else {
        toast({
          title: "❌ Payment Test Failed",
          description: result.error || 'Unknown error',
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error('🚨 Payment test error:', error);
      setLastTestResult({ 
        success: false, 
        error: error instanceof Error ? error.message : String(error) 
      });
      
      toast({
        title: "❌ Test Error",
        description: error instanceof Error ? error.message : 'Test failed',
        variant: "destructive"
      });
    } finally {
      setIsTestingPayment(false);
    }
  };

  const getResultIcon = (success: boolean) => {
    return success ? 
      <CheckCircle className="h-4 w-4 text-green-500" /> : 
      <XCircle className="h-4 w-4 text-red-500" />;
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <TestTube className="h-5 w-5" />
          Quick Payment Test
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <Button
            onClick={() => testCreditPurchase(50, 70)}
            disabled={isTestingPayment}
            variant="outline"
            size="sm"
          >
            Test 50 Credits ($70)
          </Button>
          
          <Button
            onClick={() => testCreditPurchase(100, 140)}
            disabled={isTestingPayment}
            variant="outline"
            size="sm"
          >
            Test 100 Credits ($140)
          </Button>
        </div>

        <Button
          onClick={() => testCreditPurchase(500, 700)}
          disabled={isTestingPayment}
          className="w-full"
          size="lg"
        >
          {isTestingPayment ? (
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              Testing Payment...
            </div>
          ) : (
            <>
              <CreditCard className="h-4 w-4 mr-2" />
              Test 500 Credits ($700)
            </>
          )}
        </Button>

        {/* Test Results */}
        {lastTestResult && (
          <div className="mt-4 p-3 border rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              {getResultIcon(lastTestResult.success)}
              <span className="font-medium">
                Last Test Result
              </span>
              <Badge variant={lastTestResult.success ? "default" : "destructive"}>
                {lastTestResult.success ? "Success" : "Failed"}
              </Badge>
            </div>
            
            {lastTestResult.success ? (
              <div className="space-y-1 text-sm">
                <div>✅ Payment session created successfully</div>
                {lastTestResult.url && <div>✅ Checkout URL generated</div>}
                {lastTestResult.usedFallback && <div>🧪 Using development fallback</div>}
                {lastTestResult.sessionId && <div>✅ Session ID: {lastTestResult.sessionId}</div>}
              </div>
            ) : (
              <div className="text-sm text-red-600">
                Error: {lastTestResult.error}
              </div>
            )}
          </div>
        )}

        <div className="text-xs text-gray-500 space-y-1">
          <p><strong>Test Mode:</strong> This will test the payment flow without real charges.</p>
          <p><strong>Development:</strong> Uses test Stripe keys and opens checkout in new window.</p>
          <p><strong>Production:</strong> Would create real Stripe checkout sessions.</p>
        </div>
      </CardContent>
    </Card>
  );
}
