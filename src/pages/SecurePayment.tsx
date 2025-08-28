import { useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, ExternalLink } from 'lucide-react';

function SecurePayment() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  useEffect(() => {
    // Immediately redirect to the credits checkout page
    const creditsUrl = 'https://buy.stripe.com/9B63cv1tmcYe';
    
    // Add return URLs for better UX
    const url = new URL(creditsUrl);
    const currentOrigin = window.location.origin;
    url.searchParams.set('success_url', `${currentOrigin}/payment-success?session_id={CHECKOUT_SESSION_ID}`);
    url.searchParams.set('cancel_url', `${currentOrigin}/payment-cancelled`);
    
    // Redirect to Stripe checkout
    window.location.href = url.toString();
  }, []);

  const handleGoBack = () => {
    navigate('/dashboard');
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardContent className="p-8 text-center">
          <ExternalLink className="h-12 w-12 text-blue-600 mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">Redirecting to Stripe</h3>
          <p className="text-gray-600 mb-4">
            You're being redirected to Stripe's secure checkout page...
          </p>
          <p className="text-sm text-gray-500 mb-4">
            If you're not redirected automatically, 
            <a 
              href="https://buy.stripe.com/9B63cv1tmcYe" 
              className="text-blue-600 hover:underline ml-1"
              target="_blank"
              rel="noopener noreferrer"
            >
              click here
            </a>
          </p>
          <Button onClick={handleGoBack} variant="outline" size="sm">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Return to Dashboard
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}

export default SecurePayment;
