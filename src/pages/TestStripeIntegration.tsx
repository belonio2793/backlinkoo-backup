import { SimpleBuyCreditsButton } from '@/components/SimpleBuyCreditsButton';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertCircle } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

export default function TestStripeIntegration() {
  const handlePaymentSuccess = (sessionId?: string) => {
    console.log('Payment successful:', sessionId);
    alert(`Payment successful! Session ID: ${sessionId}`);
  };

  const handlePaymentCancel = () => {
    console.log('Payment cancelled');
    alert('Payment was cancelled');
  };

  return (
    <div className="container mx-auto p-8 max-w-2xl">
      <h1 className="text-3xl font-bold mb-8">Stripe Integration</h1>
      
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Live Payment Integration</CardTitle>
          </CardHeader>
          <CardContent>
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                Test components have been removed for production. Use the live checkout buttons below.
              </AlertDescription>
            </Alert>
          </CardContent>
        </Card>
        
        <div className="p-6 border rounded-lg">
          <h3 className="text-lg font-semibold mb-4">Live Credit Purchase</h3>
          <SimpleBuyCreditsButton
            credits={100}
            onSuccess={handlePaymentSuccess}
            onCancel={handlePaymentCancel}
          />
        </div>
      </div>
    </div>
  );
}
