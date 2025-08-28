import { CreditPaymentFixTest } from '@/components/test/CreditPaymentFixTest';

export default function CreditPaymentTest() {
  return (
    <div className="container mx-auto py-8">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Credit Payment System Test</h1>
        <p className="text-muted-foreground mt-2">
          Test the credit payment system fixes including email validation and authentication handling.
        </p>
      </div>
      
      <CreditPaymentFixTest />
    </div>
  );
}

export default CreditPaymentTest;
