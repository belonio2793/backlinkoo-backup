import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, CreditCard, X } from 'lucide-react';

export default function DevStripeCheckout() {
  const [searchParams] = useSearchParams();
  const [isProcessing, setIsProcessing] = useState(false);
  const [paymentComplete, setPaymentComplete] = useState(false);

  const credits = searchParams.get('credits') || '100';
  const amount = searchParams.get('amount') || '140';
  const productName = searchParams.get('productName') || `${credits} Credits`;
  const testMode = searchParams.get('testMode') === 'true';

  useEffect(() => {
    // Simulate Stripe checkout environment
    document.title = `Stripe Checkout - ${productName}`;
  }, [productName]);

  const handlePayment = async () => {
    setIsProcessing(true);
    
    // Simulate payment processing
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    setIsProcessing(false);
    setPaymentComplete(true);
    
    // Simulate successful payment completion
    setTimeout(() => {
      // Send success message to parent window
      if (window.opener) {
        window.opener.postMessage({
          type: 'stripe-payment-success',
          sessionId: 'dev_session_' + Date.now(),
          credits: parseInt(credits),
          amount: parseFloat(amount)
        }, '*');
      }
      
      // Close the window after a delay
      setTimeout(() => {
        window.close();
      }, 1500);
    }, 1000);
  };

  const handleCancel = () => {
    // Send cancel message to parent window
    if (window.opener) {
      window.opener.postMessage({
        type: 'stripe-payment-cancelled'
      }, '*');
    }
    
    window.close();
  };

  return (
    <div className="min-h-screen bg-[#6772e5] flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Stripe-like header */}
        <div className="text-center mb-6">
          <div className="text-white text-xl font-semibold mb-2">
            Stripe Checkout
          </div>
          {testMode && (
            <Badge className="bg-orange-500 text-white">
              Test Mode - Development
            </Badge>
          )}
        </div>

        <Card className="w-full">
          <CardHeader className="text-center">
            <CardTitle className="flex items-center justify-center gap-2">
              <CreditCard className="h-5 w-5" />
              Complete Your Purchase
            </CardTitle>
          </CardHeader>
          
          <CardContent className="space-y-6">
            {!paymentComplete ? (
              <>
                {/* Product Details */}
                <div className="space-y-3">
                  <div className="text-center">
                    <h3 className="text-lg font-semibold">{productName}</h3>
                    <p className="text-gray-600">Backlink ∞ Credits</p>
                  </div>
                  
                  <div className="flex justify-between items-center py-3 border-t border-b">
                    <span>Total</span>
                    <span className="text-xl font-bold">${amount}</span>
                  </div>
                </div>

                {/* Test Mode Notice */}
                {testMode && (
                  <div className="p-3 bg-orange-50 border border-orange-200 rounded-lg">
                    <p className="text-orange-800 text-sm text-center">
                      <strong>Development Mode:</strong><br/>
                      This is a simulated payment for testing purposes.
                      No real charges will be made.
                    </p>
                  </div>
                )}

                {/* Payment Button */}
                <div className="space-y-3">
                  <Button 
                    onClick={handlePayment}
                    disabled={isProcessing}
                    className="w-full bg-[#6772e5] hover:bg-[#5469d4] h-12 text-lg"
                  >
                    {isProcessing ? (
                      <div className="flex items-center gap-2">
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        Processing Payment...
                      </div>
                    ) : (
                      `Pay $${amount}`
                    )}
                  </Button>
                  
                  <Button 
                    variant="ghost" 
                    onClick={handleCancel}
                    disabled={isProcessing}
                    className="w-full"
                  >
                    Cancel
                  </Button>
                </div>

                {/* Security Notice */}
                <div className="text-center text-xs text-gray-500">
                  <p>🔒 Powered by Stripe (Development Mode)</p>
                  <p>Your payment information is secure and encrypted</p>
                </div>
              </>
            ) : (
              /* Payment Success */
              <div className="text-center space-y-4">
                <div className="flex justify-center">
                  <CheckCircle className="h-16 w-16 text-green-500" />
                </div>
                
                <div>
                  <h3 className="text-xl font-semibold text-green-700">
                    Payment Successful!
                  </h3>
                  <p className="text-gray-600 mt-2">
                    {credits} credits will be added to your account
                  </p>
                </div>
                
                <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                  <p className="text-green-800 text-sm">
                    This window will close automatically...
                  </p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Close button */}
        <div className="text-center mt-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleCancel}
            className="text-white hover:bg-white hover:bg-opacity-20"
          >
            <X className="h-4 w-4 mr-1" />
            Close
          </Button>
        </div>
      </div>
    </div>
  );
}
