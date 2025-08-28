import { SimpleBuyCreditsButton } from '@/components/SimpleBuyCreditsButton';

export function TestStripeIntegration() {
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
      <h1 className="text-3xl font-bold mb-8">Stripe Integration Test</h1>
      
      <div className="space-y-6">
        <div className="p-6 border rounded-lg">
          <h2 className="text-xl font-semibold mb-4">Buy Credits Test</h2>
          <p className="text-gray-600 mb-4">
            This will open a new window to Stripe for payment processing.
          </p>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">50 Credits - $70</label>
              <SimpleBuyCreditsButton
                defaultCredits={50}
                onPaymentSuccess={handlePaymentSuccess}
                onPaymentCancel={handlePaymentCancel}
                guestEmail="test@example.com"
                variant="default"
                size="default"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-2">100 Credits - $140</label>
              <SimpleBuyCreditsButton
                defaultCredits={100}
                onPaymentSuccess={handlePaymentSuccess}
                onPaymentCancel={handlePaymentCancel}
                guestEmail="test@example.com"
                variant="outline"
                size="default"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-2">250 Credits - $350</label>
              <SimpleBuyCreditsButton
                defaultCredits={250}
                onPaymentSuccess={handlePaymentSuccess}
                onPaymentCancel={handlePaymentCancel}
                guestEmail="test@example.com"
                variant="secondary"
                size="default"
              />
            </div>
          </div>
        </div>
        
        <div className="p-6 border rounded-lg bg-yellow-50">
          <h3 className="text-lg font-semibold mb-2">Testing Instructions</h3>
          <ul className="text-sm space-y-1 text-gray-700">
            <li>• Click any "Buy Credits" button</li>
            <li>• A new window will open to Stripe checkout</li>
            <li>• Use test card: 4242 4242 4242 4242</li>
            <li>• Any future expiry date and CVC</li>
            <li>• Complete or cancel the payment</li>
            <li>• Window will close and show success/cancel message</li>
          </ul>
        </div>
        
        <div className="p-6 border rounded-lg bg-blue-50">
          <h3 className="text-lg font-semibold mb-2">Environment Variables Required</h3>
          <ul className="text-sm space-y-1 text-gray-700">
            <li>• STRIPE_SECRET_KEY (backend)</li>
            <li>• VITE_STRIPE_PUBLISHABLE_KEY (frontend)</li>
            <li>• SUPABASE_SERVICE_ROLE_KEY (order tracking)</li>
            <li>• VITE_SUPABASE_URL (order tracking)</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
