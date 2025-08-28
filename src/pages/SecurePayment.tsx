import { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { ArrowLeft, Loader2, AlertCircle } from 'lucide-react';
import { stripeWrapper } from '@/services/stripeWrapper';

function SecurePayment() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [isProcessing, setIsProcessing] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const processPayment = async () => {
      try {
        // Extract payment details from URL parameters
        const credits = parseInt(searchParams.get('credits') || '0');
        const amount = parseFloat(searchParams.get('amount') || '0');
        const email = searchParams.get('email') || '';
        const isGuest = searchParams.get('guest') === 'true';

        if (credits <= 0 || amount <= 0) {
          toast({
            title: 'Invalid Payment Details',
            description: 'Please return to the dashboard and try again.',
            variant: 'destructive'
          });
          navigate('/dashboard');
          return;
        }

        // Create payment session with stripeWrapper
        const result = await stripeWrapper.createPayment({
          amount,
          credits,
          productName: `${credits} Backlink Credits`,
          isGuest,
          guestEmail: email
        });

        if (result.success && result.url) {
          // Redirect directly to Stripe checkout
          window.location.href = result.url;
        } else {
          setError(result.error || 'Failed to create payment session');
          setIsProcessing(false);
        }
      } catch (error: any) {
        console.error('Payment creation error:', error);
        setError(error.message || 'Failed to create payment session');
        setIsProcessing(false);
      }
    };

    processPayment();
  }, [searchParams, navigate, toast]);

  const handleRetry = () => {
    setIsProcessing(true);
    setError(null);
    window.location.reload();
  };

  const handleCancel = () => {
    navigate('/dashboard');
  };

  if (paymentDetails.credits === 0) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardContent className="p-6 text-center">
            <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">Invalid Payment Request</h3>
            <p className="text-gray-600 mb-4">The payment details are missing or invalid.</p>
            <Button onClick={() => navigate('/dashboard')} variant="outline">
              Return to Dashboard
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md space-y-4">
        <Button 
          variant="ghost" 
          onClick={handleCancel}
          className="mb-4"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Dashboard
        </Button>

        <Card className="w-full">
          <CardHeader className="text-center">
            <CardTitle className="flex items-center justify-center gap-2">
              <CreditCard className="h-5 w-5" />
              Secure Payment
            </CardTitle>
            <p className="text-sm text-gray-600">Complete your credit purchase</p>
          </CardHeader>
          
          <CardContent className="space-y-4">
            <div className="bg-gray-50 p-4 rounded-lg space-y-2">
              <h4 className="font-semibold text-gray-900">Order Summary</h4>
              <div className="flex justify-between">
                <span>Product:</span>
                <span className="font-medium">{paymentDetails.product}</span>
              </div>
              <div className="flex justify-between">
                <span>Credits:</span>
                <span className="font-medium">{paymentDetails.credits}</span>
              </div>
              <div className="flex justify-between">
                <span>Rate:</span>
                <span>${paymentDetails.rate} per credit</span>
              </div>
              <div className="border-t pt-2 flex justify-between text-lg font-bold">
                <span>Total:</span>
                <span className="text-blue-600">${paymentDetails.amount.toFixed(2)}</span>
              </div>
            </div>

            <div className="bg-yellow-50 border border-yellow-200 p-4 rounded-lg">
              <div className="flex items-start gap-3">
                <AlertCircle className="h-5 w-5 text-yellow-600 mt-0.5" />
                <div>
                  <h5 className="font-semibold text-yellow-800">Configuration Required</h5>
                  <p className="text-sm text-yellow-700 mt-1">
                    The payment system requires server-side configuration with Supabase Edge Functions 
                    to process live payments. Please contact support to complete the setup.
                  </p>
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <Button 
                onClick={handlePayment}
                className="w-full bg-blue-600 hover:bg-blue-700"
                size="lg"
              >
                <CreditCard className="h-4 w-4 mr-2" />
                Complete Payment (Configuration Required)
              </Button>
              
              <Button 
                onClick={handleCancel}
                variant="outline" 
                className="w-full"
              >
                Cancel and Return
              </Button>
            </div>

            <div className="flex items-center justify-center gap-2 text-xs text-gray-500 pt-2">
              <Shield className="h-3 w-3" />
              <span>Secured by Stripe • 256-bit SSL encryption</span>
            </div>
          </CardContent>
        </Card>

        <Card className="w-full">
          <CardHeader>
            <CardTitle className="text-sm">Setup Instructions</CardTitle>
          </CardHeader>
          <CardContent className="text-xs text-gray-600 space-y-2">
            <p>To enable live payments, configure these environment variables in Supabase:</p>
            <ul className="list-disc list-inside space-y-1 ml-2">
              <li><code>SUPABASE_URL</code> - Your Supabase project URL</li>
              <li><code>SUPABASE_SERVICE_ROLE_KEY</code> - Service role key</li>
              <li><code>STRIPE_SECRET_KEY</code> - Your Stripe secret key</li>
            </ul>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export default SecurePayment;
