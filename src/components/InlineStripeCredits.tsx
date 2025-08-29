import { useEffect, useMemo, useState } from 'react';
import { loadStripe, StripeElementsOptions, Stripe as StripeJs } from '@stripe/stripe-js';
import { Elements, PaymentElement, useElements, useStripe } from '@stripe/react-stripe-js';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';

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
  const [stripe, setStripe] = useState<StripeJs | null>(null);

  useEffect(() => {
    const loadConfigAndIntent = async () => {
      setClientSecret(null);
      setStripe(null);
      try {
        // 1) Fetch publishable key from server using STRIPE_PUBLISHABLE_KEY via Netlify first
        const configUrls = ['/.netlify/functions/public-config', '/api/public-config'];
        let keyData: any = null;
        for (const url of configUrls) {
          try {
            const res = await fetch(url, { headers: { Accept: 'application/json' } });
            const ct = res.headers.get('content-type') || '';
            let json: any = null;
            if (ct.includes('application/json')) {
              try { json = await res.json(); } catch {}
            } else {
              // Non-JSON response; read as text for debugging context
              try { await res.text(); } catch {}
            }
            if (res.ok && json?.stripePublishableKey) {
              keyData = json;
              break;
            }
          } catch {}
        }
        // Final safety: allow a publishable key from Vite env if serverless route is unavailable
        const publishableKey = keyData?.stripePublishableKey || (import.meta as any)?.env?.VITE_STRIPE_PUBLISHABLE_KEY || '';
        if (!publishableKey) throw new Error('Missing publishable key');
        const stripeInstance = await loadStripe(publishableKey);
        if (!stripeInstance) throw new Error('Failed to load Stripe');
        setStripe(stripeInstance);

        // 2) Create payment intent for current credits with strict JSON + fallback
        const attempt = async (url: string) => {
          const res = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
            body: JSON.stringify({ credits, email })
          });
          const ct = res.headers.get('content-type') || '';
          let data: any = null;
          if (ct.includes('application/json')) {
            try { data = await res.json(); } catch {}
          }
          if (!res.ok || !data || !data.clientSecret) {
            const msg = (data && data.error) ? data.error : `Non-JSON or HTTP ${res.status}`;
            throw new Error(msg);
          }
          return data;
        };
        let data: any;
        try {
          data = await attempt('/api/create-payment-intent');
        } catch {
          data = await attempt('/.netlify/functions/create-payment-intent');
        }
        setClientSecret(data.clientSecret || null);
      } catch (e:any) {
        console.error('create-payment-intent error', e);
        setClientSecret(null);
      }
    };
    if (credits > 0) loadConfigAndIntent();
  }, [credits, email]);

  const options: StripeElementsOptions | undefined = useMemo(() => clientSecret ? ({ clientSecret, appearance: { theme: 'stripe' } }) : undefined, [clientSecret]);

  if (!stripe || !clientSecret) return <div className="text-sm text-muted-foreground">Preparing secure checkout…</div>;

  return (
    <Elements stripe={stripe} options={options}>
      <InnerCheckout credits={credits} email={email} onSuccess={onSuccess} />
    </Elements>
  );
}
