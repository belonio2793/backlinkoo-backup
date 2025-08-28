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

  if (isProcessing) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardContent className="p-8 text-center">
            <Loader2 className="h-12 w-12 text-blue-600 mx-auto mb-4 animate-spin" />
            <h3 className="text-lg font-semibold mb-2">Redirecting to Stripe Checkout</h3>
            <p className="text-gray-600 mb-4">
              Please wait while we redirect you to the secure payment page...
            </p>
            <Button onClick={handleCancel} variant="outline" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Cancel
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardContent className="p-6 text-center">
            <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">Payment Error</h3>
            <p className="text-gray-600 mb-4">{error}</p>
            <div className="space-y-2">
              <Button onClick={handleRetry} className="w-full">
                Try Again
              </Button>
              <Button onClick={handleCancel} variant="outline" className="w-full">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Return to Dashboard
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return null;
}

export default SecurePayment;
