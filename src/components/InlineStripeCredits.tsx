import { useEffect, useMemo, useState } from 'react';
import { loadStripe, StripeElementsOptions } from '@stripe/stripe-js';
import { Elements, PaymentElement, useElements, useStripe } from '@stripe/react-stripe-js';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';

const publishableKey = (import.meta as any).env?.VITE_STRIPE_PUBLISHABLE_KEY || (import.meta as any).env?.STRIPE_PUBLISHABLE_KEY || '';
const stripePromise = publishableKey ? loadStripe(publishableKey) : null;

function InnerCheckout({ credits, email, onSuccess }:{ credits:number; email?:string; onSuccess?:()=>void }){
  const stripe = useStripe();
  const elements = useElements();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);

  const handlePay = async () => {
    if (!stripe || !elements) return;
    setLoading(true);
    const { error, paymentIntent } = await stripe.confirmPayment({
      elements,
      redirect: 'if_required',
      confirmParams: { receipt_email: email }
    });

    if (error) {
      toast({ title: 'Payment failed', description: error.message || 'Try again', variant: 'destructive' });
    } else if (paymentIntent && paymentIntent.status === 'succeeded') {
      toast({ title: 'Payment successful', description: `${credits} credits purchased` });
      onSuccess?.();
    }
    setLoading(false);
  };

  return (
    <div className="space-y-3">
      <PaymentElement options={{ layout: 'tabs' }} />
      <Button className="w-full" disabled={!stripe || loading} onClick={handlePay}>
        {loading ? 'Processing…' : 'Pay securely'}
      </Button>
    </div>
  );
}

export default function InlineStripeCredits({ credits, email, onSuccess }:{ credits:number; email?:string; onSuccess?:()=>void }){
  const [clientSecret, setClientSecret] = useState<string | null>(null);

  useEffect(() => {
    const run = async () => {
      setClientSecret(null);
      try {
        const res = await fetch('/.netlify/functions/create-payment-intent', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ credits, email })
        });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();
        setClientSecret(data.clientSecret || null);
      } catch (e:any) {
        console.error('create-payment-intent error', e);
        setClientSecret(null);
      }
    };
    if (credits > 0) run();
  }, [credits, email]);

  const options: StripeElementsOptions | undefined = useMemo(() => clientSecret ? ({ clientSecret, appearance: { theme: 'stripe' } }) : undefined, [clientSecret]);

  if (!stripePromise) return null;
  if (!clientSecret) return <div className="text-sm text-muted-foreground">Preparing secure checkout…</div>;

  return (
    <Elements stripe={stripePromise} options={options}>
      <InnerCheckout credits={credits} email={email} onSuccess={onSuccess} />
    </Elements>
  );
}
