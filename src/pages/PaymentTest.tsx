import { Header } from '@/components/Header';
import { SupabasePaymentTest } from '@/components/SupabasePaymentTest';
import { PaymentFlowTest } from '@/components/PaymentFlowTest';
import { PaymentDebugger } from '@/components/PaymentDebugger';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

export function PaymentTest() {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-3xl font-bold text-center mb-2">
            Payment System Testing
          </h1>
          <p className="text-muted-foreground text-center mb-8">
            Test the payment flow with your Supabase configuration and Stripe keys
          </p>

          <Tabs defaultValue="debugger" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="debugger">Payment Debugger</TabsTrigger>
              <TabsTrigger value="supabase">Supabase Edge Functions</TabsTrigger>
              <TabsTrigger value="legacy">Legacy Payment Flow</TabsTrigger>
            </TabsList>
            
            <TabsContent value="debugger" className="mt-6">
              <PaymentDebugger />
            </TabsContent>

            <TabsContent value="supabase" className="mt-6">
              <SupabasePaymentTest />
            </TabsContent>
            
            <TabsContent value="legacy" className="mt-6">
              <PaymentFlowTest />
            </TabsContent>
          </Tabs>

          <div className="mt-8 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <h3 className="font-semibold text-blue-900 mb-2">🔧 Testing Instructions</h3>
            <ul className="text-sm text-blue-800 space-y-1">
              <li>• <strong>Payment Debugger:</strong> Comprehensive diagnosis of all payment system components</li>
              <li>• <strong>Supabase Edge Functions:</strong> Uses your real Stripe keys configured in Supabase secrets</li>
              <li>• <strong>Legacy Payment Flow:</strong> Tests fallback endpoints and local configuration</li>
              <li>• All tests are safe and won't create real charges (test mode)</li>
              <li>• Check browser console for detailed logging</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}

export default PaymentTest;
