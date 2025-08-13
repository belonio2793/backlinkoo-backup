/**
 * Payment Success Page
 * Handles successful Stripe payment redirects and verifies payment completion
 */

import React, { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { 
  CheckCircle, 
  Loader2, 
  CreditCard, 
  Crown, 
  Home, 
  ExternalLink,
  RefreshCw,
  AlertTriangle
} from 'lucide-react';

interface PaymentVerification {
  verified: boolean;
  credits?: number;
  plan?: string;
  error?: string;
  orderId?: string;
}

export default function PaymentSuccess() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useAuth();
  const [verifying, setVerifying] = useState(true);
  const [verification, setVerification] = useState<PaymentVerification | null>(null);

  const sessionId = searchParams.get('session_id');
  const credits = searchParams.get('credits');
  const plan = searchParams.get('plan');

  useEffect(() => {
    if (sessionId) {
      verifyPayment();
    } else {
      setVerifying(false);
      setVerification({
        verified: false,
        error: 'No payment session found'
      });
    }
  }, [sessionId]);

  const verifyPayment = async () => {
    try {
      setVerifying(true);

      // Call our payment verification function
      const response = await fetch(`/.netlify/functions/verify-payment?session_id=${sessionId}`);
      
      if (!response.ok) {
        throw new Error(`Verification failed: ${response.status}`);
      }

      const result = await response.json();
      
      setVerification(result);
      
      if (result.verified) {
        toast({
          title: "Payment Verified!",
          description: result.credits 
            ? `${result.credits} credits have been added to your account.`
            : result.plan 
              ? `Your ${result.plan} subscription is now active.`
              : "Your payment has been processed successfully.",
        });

        // Send success message to parent window if this is a popup
        if (window.opener) {
          window.opener.postMessage({
            type: 'stripe-payment-success',
            sessionId: sessionId
          }, window.location.origin);
        }
      } else {
        toast({
          title: "Payment Verification Failed",
          description: result.error || "Unable to verify payment status.",
          variant: "destructive"
        });
      }

    } catch (error) {
      console.error('Payment verification error:', error);
      setVerification({
        verified: false,
        error: error instanceof Error ? error.message : 'Verification failed'
      });
      
      toast({
        title: "Verification Error",
        description: "Unable to verify payment. Please contact support if your payment was charged.",
        variant: "destructive"
      });
    } finally {
      setVerifying(false);
    }
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

  const handleRetryVerification = () => {
    verifyPayment();
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4">
            {verifying ? (
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center">
                <Loader2 className="h-8 w-8 text-blue-600 animate-spin" />
              </div>
            ) : verification?.verified ? (
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
                <CheckCircle className="h-8 w-8 text-green-600" />
              </div>
            ) : (
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center">
                <AlertTriangle className="h-8 w-8 text-red-600" />
              </div>
            )}
          </div>
          
          <CardTitle className="text-2xl">
            {verifying ? 'Verifying Payment...' : verification?.verified ? 'Payment Successful!' : 'Payment Verification Failed'}
          </CardTitle>
          
          <CardDescription>
            {verifying 
              ? 'Please wait while we confirm your payment...'
              : verification?.verified 
                ? 'Your purchase has been processed successfully.'
                : 'There was an issue verifying your payment.'
            }
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-4">
          {/* Payment Details */}
          {sessionId && (
            <div className="bg-gray-50 p-3 rounded-lg">
              <div className="text-xs text-gray-500 mb-1">Session ID</div>
              <div className="font-mono text-sm break-all">{sessionId}</div>
            </div>
          )}

          {/* Success Details */}
          {verification?.verified && (
            <div className="space-y-3">
              {verification.credits && (
                <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                  <div className="flex items-center gap-2">
                    <CreditCard className="h-5 w-5 text-green-600" />
                    <span className="font-medium">Credits Added</span>
                  </div>
                  <Badge variant="secondary" className="bg-green-100 text-green-800">
                    +{verification.credits} Credits
                  </Badge>
                </div>
              )}

              {verification.plan && (
                <div className="flex items-center justify-between p-3 bg-purple-50 rounded-lg">
                  <div className="flex items-center gap-2">
                    <Crown className="h-5 w-5 text-purple-600" />
                    <span className="font-medium">Subscription Active</span>
                  </div>
                  <Badge variant="secondary" className="bg-purple-100 text-purple-800">
                    {verification.plan.charAt(0).toUpperCase() + verification.plan.slice(1)} Plan
                  </Badge>
                </div>
              )}
            </div>
          )}

          {/* Error Details */}
          {verification && !verification.verified && (
            <Alert className="border-red-200 bg-red-50">
              <AlertTriangle className="h-4 w-4 text-red-600" />
              <AlertDescription className="text-red-800">
                {verification.error || 'Payment could not be verified. Please contact support if you were charged.'}
              </AlertDescription>
            </Alert>
          )}

          {/* Action Buttons */}
          <div className="space-y-3 pt-4">
            {verification?.verified ? (
              <Button 
                onClick={handleContinue}
                className="w-full bg-green-600 hover:bg-green-700"
              >
                <Home className="h-4 w-4 mr-2" />
                {window.opener ? 'Close Window' : 'Continue to Dashboard'}
              </Button>
            ) : !verifying && (
              <>
                <Button 
                  onClick={handleRetryVerification}
                  variant="outline"
                  className="w-full"
                >
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Retry Verification
                </Button>
                <Button 
                  onClick={handleContinue}
                  variant="secondary"
                  className="w-full"
                >
                  <Home className="h-4 w-4 mr-2" />
                  Continue to Dashboard
                </Button>
              </>
            )}

            {/* Support Link */}
            <Button 
              variant="ghost" 
              className="w-full text-gray-600 hover:text-gray-800"
              onClick={() => window.open('mailto:support@backlinkoo.com')}
            >
              <ExternalLink className="h-4 w-4 mr-2" />
              Contact Support
            </Button>
          </div>

          {/* Additional Information */}
          <div className="text-xs text-gray-500 text-center border-t pt-4">
            {verification?.verified ? (
              <>
                Your account has been updated and you can start using your new credits or premium features immediately.
              </>
            ) : (
              <>
                If you were charged but see an error, please contact support with your session ID.
              </>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
