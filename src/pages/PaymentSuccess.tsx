/**
 * Payment Success Page
 * Simple page to handle successful payment redirects from Stripe
 */

import React, { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CheckCircle, Crown, CreditCard, ArrowRight } from 'lucide-react';

export function PaymentSuccess() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [countdown, setCountdown] = useState(5);

  const paymentType = searchParams.get('type');
  const credits = searchParams.get('credits');
  const plan = searchParams.get('plan');

  useEffect(() => {
    // Auto-redirect after 5 seconds
    const timer = setInterval(() => {
      setCountdown(prev => {
        if (prev <= 1) {
          navigate('/dashboard');
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [navigate]);

  const handleGoToDashboard = () => {
    navigate('/dashboard');
  };

  const getSuccessMessage = () => {
    if (paymentType === 'premium') {
      return {
        title: 'Welcome to Premium!',
        description: `Your ${plan === 'annual' ? 'annual' : 'monthly'} premium subscription is now active.`,
        icon: <Crown className="h-8 w-8 text-yellow-500" />
      };
    } else {
      return {
        title: 'Credits Added Successfully!',
        description: `${credits || '50'} credits have been added to your account.`,
        icon: <CreditCard className="h-8 w-8 text-green-500" />
      };
    }
  };

  const { title, description, icon } = getSuccessMessage();

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 p-3 bg-green-100 rounded-full w-fit">
            <CheckCircle className="h-8 w-8 text-green-600" />
          </div>
          <CardTitle className="text-2xl font-bold text-green-800">
            Payment Successful!
          </CardTitle>
        </CardHeader>
        
        <CardContent className="text-center space-y-6">
          <div className="flex items-center justify-center gap-3">
            {icon}
            <div>
              <h3 className="font-semibold text-lg">{title}</h3>
              <p className="text-muted-foreground">{description}</p>
            </div>
          </div>

          <div className="space-y-4">
            <Button 
              onClick={handleGoToDashboard}
              className="w-full"
            >
              <ArrowRight className="h-4 w-4 mr-2" />
              Go to Dashboard
            </Button>
            
            <p className="text-sm text-muted-foreground">
              Redirecting automatically in {countdown} seconds...
            </p>
          </div>

          {paymentType === 'premium' && (
            <div className="bg-gradient-to-r from-purple-50 to-blue-50 p-4 rounded-lg">
              <h4 className="font-semibold text-purple-800 mb-2">Premium Features Unlocked:</h4>
              <ul className="text-sm text-purple-700 space-y-1">
                <li>• Unlimited blog posts</li>
                <li>• Advanced campaign automation</li>
                <li>• Priority support</li>
                <li>• Advanced analytics</li>
              </ul>
            </div>
          )}

          {paymentType === 'credits' && (
            <div className="bg-gradient-to-r from-green-50 to-blue-50 p-4 rounded-lg">
              <p className="text-sm text-green-700">
                Your credits are ready to use! You can now generate more blog posts and run additional campaigns.
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

export default PaymentSuccess;
