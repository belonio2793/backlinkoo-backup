import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { PremiumUpgradeService } from '@/services/premiumUpgradeService';
import { PaymentVerificationService } from '@/services/paymentVerificationService';
import { CheckCircle, Crown, ArrowRight, Sparkles, Loader2, X } from 'lucide-react';

export default function PaymentSuccess() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { toast } = useToast();
  const { user, isLoading: authLoading } = useAuth();
  const [isProcessing, setIsProcessing] = useState(true);
  const [redirectUrl, setRedirectUrl] = useState('/dashboard');
  const [processingError, setProcessingError] = useState<string | null>(null);

  useEffect(() => {
    const processPaymentSuccess = async () => {
      if (authLoading) return;

      const sessionId = searchParams.get('session_id');
      const orderId = searchParams.get('order_id');
      const paymentMethod = searchParams.get('payment_method') as 'stripe' | 'paypal' | null;

      try {
        let result;

        if (sessionId || orderId || paymentMethod) {
          // Process payment verification with enhanced service
          result = await PaymentVerificationService.verifyPayment({
            sessionId: sessionId || undefined,
            orderId: orderId || undefined,
            paymentMethod: paymentMethod || undefined
          });
        } else {
          // No payment identifiers - might be from fallback service
          result = await PaymentVerificationService.handleFallbackUpgrade();
        }

        if (result.success) {
          setRedirectUrl(result.redirectUrl || '/dashboard');
          toast({
            title: "🎉 Welcome to Premium!",
            description: "Your account has been successfully upgraded. Enjoy all premium features!",
          });
        } else {
          setProcessingError(result.error || 'Failed to process upgrade');
        }
      } catch (error: any) {
        console.error('Error processing payment success:', error);
        setProcessingError(error.message || 'An unexpected error occurred');
      }

      setIsProcessing(false);
    };

    processPaymentSuccess();
  }, [user, authLoading, searchParams, toast]);

  // Auto-redirect after 3 seconds
  useEffect(() => {
    if (!isProcessing && !processingError) {
      const timer = setTimeout(() => {
        navigate(redirectUrl);
      }, 3000);

      return () => clearTimeout(timer);
    }
  }, [isProcessing, processingError, redirectUrl, navigate]);

  if (authLoading || isProcessing) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardContent className="text-center py-12">
            <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <Loader2 className="h-8 w-8 text-purple-600 animate-spin" />
            </div>
            <h2 className="text-2xl font-bold mb-2">Processing Your Upgrade</h2>
            <p className="text-gray-600">
              Please wait while we confirm your payment and activate your premium features...
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (processingError) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 to-orange-50 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <X className="h-8 w-8 text-red-600" />
            </div>
            <CardTitle className="text-2xl text-red-600">Upgrade Error</CardTitle>
          </CardHeader>
          <CardContent className="text-center space-y-4">
            <p className="text-gray-600">{processingError}</p>
            <div className="space-y-2">
              <Button onClick={() => navigate('/dashboard')} className="w-full">
                <ArrowRight className="h-4 w-4 mr-2" />
                Go to Dashboard
              </Button>
              <Button 
                variant="outline" 
                onClick={() => window.location.href = 'mailto:support@backlinkoo.com'}
                className="w-full"
              >
                Contact Support
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="w-20 h-20 bg-gradient-to-br from-green-100 to-green-200 rounded-full flex items-center justify-center mx-auto mb-6 relative">
            <CheckCircle className="h-12 w-12 text-green-600" />
            <div className="absolute -top-2 -right-2 w-8 h-8 bg-gradient-to-br from-purple-100 to-purple-200 rounded-full flex items-center justify-center">
              <Crown className="h-5 w-5 text-purple-600" />
            </div>
          </div>
          <CardTitle className="text-3xl font-bold text-green-600 mb-2">
            Welcome to Premium!
          </CardTitle>
          <p className="text-gray-600">
            Your payment was successful and your account has been upgraded.
          </p>
        </CardHeader>
        
        <CardContent className="space-y-6">
          {/* Premium Features Unlocked */}
          <div className="p-4 bg-gradient-to-r from-purple-50 to-blue-50 rounded-lg border border-purple-200">
            <div className="flex items-center gap-2 mb-3">
              <Sparkles className="h-5 w-5 text-purple-600" />
              <span className="font-semibold text-purple-800">Premium Features Unlocked!</span>
            </div>
            <div className="space-y-2 text-sm text-purple-700">
              <div className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4" />
                <span>Unlimited high-quality backlinks</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4" />
                <span>100/100 SEO optimized content</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4" />
                <span>Advanced analytics & insights</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4" />
                <span>Priority customer support</span>
              </div>
            </div>
          </div>

          {/* Auto-redirect Notice */}
          <div className="text-center p-4 bg-blue-50 rounded-lg">
            <p className="text-sm text-blue-700 mb-2">
              Redirecting you to your dashboard in a few seconds...
            </p>
            <div className="w-full bg-blue-200 rounded-full h-2 overflow-hidden">
              <div className="h-full bg-blue-600 rounded-full animate-pulse"></div>
            </div>
          </div>

          {/* Manual Navigation */}
          <div className="space-y-2">
            <Button 
              onClick={() => navigate(redirectUrl)} 
              className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
            >
              <ArrowRight className="h-4 w-4 mr-2" />
              Go to Dashboard Now
            </Button>
            
            <Button 
              variant="outline" 
              onClick={() => navigate('/blog')}
              className="w-full"
            >
              Explore Premium Content
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
