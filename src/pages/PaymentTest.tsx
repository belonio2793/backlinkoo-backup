import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { EnhancedUnifiedPaymentModal } from '@/components/EnhancedUnifiedPaymentModal';
import { UniversalPaymentTrigger, BuyCreditsButton, UpgradeToPremiumButton } from '@/components/UniversalPaymentTrigger';
import { 
  CreditCard, 
  Crown, 
  Zap, 
  TestTube,
  DollarSign,
  Star,
  Shield,
  Infinity
} from 'lucide-react';

export function PaymentTest() {
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [paymentType, setPaymentType] = useState<'credits' | 'premium'>('credits');

  const openPaymentModal = (type: 'credits' | 'premium') => {
    setPaymentType(type);
    setShowPaymentModal(true);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 p-6">
      <div className="max-w-4xl mx-auto space-y-8">
        {/* Header */}
        <div className="text-center space-y-4">
          <div className="flex items-center justify-center gap-2">
            <TestTube className="h-8 w-8 text-blue-600" />
            <h1 className="text-3xl font-bold text-gray-900">Payment Integration Test</h1>
          </div>
          <p className="text-gray-600 max-w-2xl mx-auto">
            Test the complete payment integration with Stripe and PayPal. Click any button below to test the payment flow.
          </p>
          <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
            <Shield className="h-3 w-3 mr-1" />
            Test Mode - No Real Charges
          </Badge>
        </div>

        {/* Payment Options */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Credits Purchase */}
          <Card className="relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-blue-500/10 to-purple-500/10 rounded-full -translate-y-16 translate-x-16" />
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CreditCard className="h-5 w-5 text-blue-600" />
                Buy Credits
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-gray-600">Purchase backlink credits for one-time use.</p>
              
              <div className="space-y-3">
                <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                  <span>10 Credits</span>
                  <span className="font-semibold">$29</span>
                </div>
                <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                  <span>25 Credits</span>
                  <span className="font-semibold">$59</span>
                </div>
                <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                  <span>50 Credits</span>
                  <span className="font-semibold">$99</span>
                </div>
              </div>

              <Button 
                onClick={() => openPaymentModal('credits')}
                className="w-full bg-blue-600 hover:bg-blue-700"
              >
                <DollarSign className="h-4 w-4 mr-2" />
                Test Credit Purchase
              </Button>

              <BuyCreditsButton className="w-full" variant="outline">
                Universal Credits Button
              </BuyCreditsButton>
            </CardContent>
          </Card>

          {/* Premium Subscription */}
          <Card className="relative overflow-hidden border-purple-200">
            <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-purple-500/10 to-pink-500/10 rounded-full -translate-y-16 translate-x-16" />
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Crown className="h-5 w-5 text-purple-600" />
                Premium Subscription
                <Badge className="bg-purple-100 text-purple-700 hover:bg-purple-100">Popular</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-gray-600">Unlimited access to all premium features.</p>
              
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-sm">
                  <Infinity className="h-4 w-4 text-purple-600" />
                  <span>Unlimited backlinks</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Zap className="h-4 w-4 text-purple-600" />
                  <span>Advanced SEO tools</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Star className="h-4 w-4 text-purple-600" />
                  <span>Priority support</span>
                </div>
              </div>

              <div className="p-3 bg-purple-50 rounded-lg">
                <div className="text-2xl font-bold text-purple-900">$29/month</div>
                <div className="text-sm text-purple-700">or $290/year (save 17%)</div>
              </div>

              <Button 
                onClick={() => openPaymentModal('premium')}
                className="w-full bg-purple-600 hover:bg-purple-700"
              >
                <Crown className="h-4 w-4 mr-2" />
                Test Premium Upgrade
              </Button>

              <UpgradeToPremiumButton className="w-full" variant="outline">
                Universal Premium Button
              </UpgradeToPremiumButton>
            </CardContent>
          </Card>
        </div>

        {/* Universal Payment Trigger Examples */}
        <Card>
          <CardHeader>
            <CardTitle>Universal Payment Components</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <UniversalPaymentTrigger
                trigger={
                  <Button variant="outline" className="w-full">
                    Custom Trigger Button
                  </Button>
                }
                initialTab="credits"
                title="Buy Backlink Credits"
              />
              
              <UniversalPaymentTrigger
                trigger={
                  <Button variant="outline" className="w-full">
                    Custom Premium Trigger
                  </Button>
                }
                initialTab="premium"
                title="Upgrade to Premium"
              />
            </div>
          </CardContent>
        </Card>

        {/* Test Status */}
        <Card className="bg-yellow-50 border-yellow-200">
          <CardContent className="p-4">
            <div className="flex items-start gap-3">
              <TestTube className="h-5 w-5 text-yellow-600 mt-0.5" />
              <div>
                <h3 className="font-semibold text-yellow-900">Testing Instructions</h3>
                <div className="text-sm text-yellow-800 mt-1 space-y-1">
                  <p>• Use Stripe test card: <code className="bg-yellow-100 px-1 rounded">4242 4242 4242 4242</code></p>
                  <p>• Any future expiry date and any 3-digit CVC</p>
                  <p>• PayPal test mode will redirect to sandbox</p>
                  <p>• All payments are processed in test mode - no real charges</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Payment Modal */}
      <EnhancedUnifiedPaymentModal
        isOpen={showPaymentModal}
        onClose={() => setShowPaymentModal(false)}
        initialTab={paymentType}
      />
    </div>
  );
}

export default PaymentTest;
