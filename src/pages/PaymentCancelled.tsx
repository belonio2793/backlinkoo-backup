/**
 * Payment Cancelled Page
 * Handles cancelled Stripe payment redirects
 */

import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  XCircle, 
  ArrowLeft, 
  CreditCard, 
  Home,
  HelpCircle
} from 'lucide-react';

export default function PaymentCancelled() {
  const navigate = useNavigate();

  const handleRetry = () => {
    // Close popup if this is a popup window
    if (window.opener) {
      window.opener.postMessage({
        type: 'stripe-payment-cancelled'
      }, window.location.origin);
      window.close();
      return;
    }

    // Otherwise navigate back to dashboard
    navigate('/dashboard');
  };

  const handleContinue = () => {
    // Close popup if this is a popup window
    if (window.opener) {
      window.close();
      return;
    }

    // Otherwise navigate to dashboard
    navigate('/dashboard');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <XCircle className="h-8 w-8 text-gray-600" />
          </div>
          
          <CardTitle className="text-2xl">Payment Cancelled</CardTitle>
          
          <CardDescription>
            Your payment was cancelled. No charges were made to your account.
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-4">
          {/* Information */}
          <div className="bg-blue-50 p-4 rounded-lg">
            <h3 className="font-medium text-blue-900 mb-2">What happened?</h3>
            <p className="text-sm text-blue-800">
              You cancelled the payment process or closed the payment window before completing the transaction. 
              Your payment method was not charged.
            </p>
          </div>

          {/* Action Buttons */}
          <div className="space-y-3 pt-4">
            <Button 
              onClick={handleRetry}
              className="w-full bg-blue-600 hover:bg-blue-700"
            >
              <CreditCard className="h-4 w-4 mr-2" />
              {window.opener ? 'Try Payment Again' : 'Return to Purchase'}
            </Button>

            <Button 
              onClick={handleContinue}
              variant="outline"
              className="w-full"
            >
              <Home className="h-4 w-4 mr-2" />
              {window.opener ? 'Close Window' : 'Continue to Dashboard'}
            </Button>

            {/* Help Link */}
            <Button 
              variant="ghost" 
              className="w-full text-gray-600 hover:text-gray-800"
              onClick={() => window.open('mailto:support@backlinkoo.com')}
            >
              <HelpCircle className="h-4 w-4 mr-2" />
              Need Help?
            </Button>
          </div>

          {/* Additional Information */}
          <div className="text-xs text-gray-500 text-center border-t pt-4">
            You can try the payment again at any time. If you're experiencing issues, 
            please contact our support team for assistance.
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
