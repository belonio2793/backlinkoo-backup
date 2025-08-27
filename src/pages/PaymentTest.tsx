import { PaymentTestButton } from '@/components/PaymentTestButton';
import { BuyCreditsButton } from '@/components/BuyCreditsButton';
import { DirectPaymentButtons } from '@/components/DirectPaymentButtons';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { AlertTriangle, CheckCircle, CreditCard } from 'lucide-react';

export default function PaymentTest() {
  const stripePublicKey = import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY;
  const isLiveMode = stripePublicKey?.includes('live');
  const isConfigured = stripePublicKey && stripePublicKey.startsWith('pk_');

  return (
    <div className="container mx-auto p-6 space-y-8">
      <div className="space-y-2">
        <h1 className="text-3xl font-bold">Payment System Testing</h1>
        <p className="text-muted-foreground">
          Test the Stripe payment integration with live configuration
        </p>
      </div>

      {/* Configuration Status */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            {isConfigured ? (
              <CheckCircle className="h-5 w-5 text-green-600" />
            ) : (
              <AlertTriangle className="h-5 w-5 text-red-600" />
            )}
            Stripe Configuration Status
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <span className="text-sm font-medium">Public Key</span>
              <div className="flex items-center gap-2">
                <Badge variant={isConfigured ? 'default' : 'destructive'}>
                  {isConfigured ? 'Configured' : 'Missing'}
                </Badge>
                {isLiveMode && (
                  <Badge variant="destructive">LIVE MODE</Badge>
                )}
              </div>
              {stripePublicKey && (
                <p className="text-xs text-muted-foreground font-mono">
                  {stripePublicKey.substring(0, 20)}...
                </p>
              )}
            </div>

            <div className="space-y-2">
              <span className="text-sm font-medium">Environment</span>
              <Badge variant={isLiveMode ? 'destructive' : 'secondary'}>
                {isLiveMode ? 'Production' : 'Development'}
              </Badge>
            </div>

            <div className="space-y-2">
              <span className="text-sm font-medium">Status</span>
              <Badge variant={isConfigured ? 'default' : 'outline'}>
                {isConfigured ? 'Ready for Testing' : 'Configuration Needed'}
              </Badge>
            </div>
          </div>

          {isLiveMode && (
            <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
              <div className="flex items-center gap-2 text-red-800">
                <AlertTriangle className="h-4 w-4" />
                <span className="font-medium">Live Mode Warning</span>
              </div>
              <p className="text-sm text-red-700 mt-1">
                You are using live Stripe keys. Any completed purchases will result in real charges.
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Integration Test */}
      <PaymentTestButton />

      {/* Actual Payment Components */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CreditCard className="h-5 w-5" />
            Live Payment Components
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            These are the actual payment components used in production
          </p>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Standard Buy Credits Buttons */}
          <div className="space-y-3">
            <h3 className="font-semibold">Standard Credit Purchase Buttons</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <BuyCreditsButton credits={50} amount={70} quickBuy={false} showModal={true}>
                50 Credits - $70
              </BuyCreditsButton>
              <BuyCreditsButton credits={100} amount={140} quickBuy={false} showModal={true}>
                100 Credits - $140
              </BuyCreditsButton>
              <BuyCreditsButton credits={250} amount={350} quickBuy={false} showModal={true}>
                250 Credits - $350
              </BuyCreditsButton>
              <BuyCreditsButton credits={500} amount={700} quickBuy={false} showModal={true}>
                500 Credits - $700
              </BuyCreditsButton>
            </div>
          </div>

          {/* Direct Purchase Buttons */}
          <div className="space-y-3">
            <h3 className="font-semibold">Direct Purchase Buttons (No Modal)</h3>
            <DirectPaymentButtons />
          </div>

          {/* Quick Buy Options */}
          <div className="space-y-3">
            <h3 className="font-semibold">Quick Buy (Direct Checkout)</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <BuyCreditsButton credits={50} amount={70} quickBuy={true} showModal={false} variant="outline">
                Quick: 50 Credits
              </BuyCreditsButton>
              <BuyCreditsButton credits={100} amount={140} quickBuy={true} showModal={false} variant="outline">
                Quick: 100 Credits
              </BuyCreditsButton>
              <BuyCreditsButton credits={250} amount={350} quickBuy={true} showModal={false} variant="outline">
                Quick: 250 Credits
              </BuyCreditsButton>
              <BuyCreditsButton credits={500} amount={700} quickBuy={true} showModal={false} variant="outline">
                Quick: 500 Credits
              </BuyCreditsButton>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Testing Notes */}
      <Card>
        <CardHeader>
          <CardTitle>Testing Notes</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="text-sm space-y-2">
            <p><strong>Modal Flow:</strong> Opens payment modal → Configure credits → Creates Stripe checkout in new window</p>
            <p><strong>Direct Flow:</strong> Bypasses modal → Immediately creates Stripe checkout in new window</p>
            <p><strong>Quick Buy:</strong> Preset amounts → Direct checkout without modal</p>
          </div>
          
          <div className="p-3 bg-amber-50 border border-amber-200 rounded">
            <p className="text-sm text-amber-800">
              <strong>Important:</strong> All payment buttons use live Stripe configuration. 
              Test payments carefully to avoid unintended charges.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
