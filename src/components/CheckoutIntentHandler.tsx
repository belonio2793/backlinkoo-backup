import React, { useEffect, useRef } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { getCheckoutIntent, clearCheckoutIntent } from '@/utils/checkoutIntent';
import { CreditPaymentService } from '@/services/creditPaymentService';
import SubscriptionService from '@/services/subscriptionService';
import { stripeWrapper } from '@/services/stripeWrapper';

export default function CheckoutIntentHandler() {
  const { user } = useAuth();
  const { toast } = useToast();
  const processingRef = useRef(false);

  useEffect(() => {
    if (!user || processingRef.current) return;

    const intent = getCheckoutIntent();
    if (!intent) return;

    processingRef.current = true;

    const process = async () => {
      try {
        if (intent.type === 'credits') {
          let result;

          try {
            // Try Stripe Wrapper first
            result = await stripeWrapper.createPayment({
              amount: intent.price,
              credits: intent.credits,
              productName: `${intent.credits} Premium Backlink Credits`,
              isGuest: false
            });

            if (result.success) {
              console.log(`✅ Credit payment resumed via ${result.method}${result.fallbackUsed ? ' (fallback)' : ''}`);
            }
          } catch (wrapperError) {
            console.warn('⚠️ Stripe Wrapper failed, using legacy service:', wrapperError);

            // Fallback to legacy service
            result = await CreditPaymentService.createCreditPayment(
              user,
              false,
              undefined,
              {
                amount: intent.price,
                credits: intent.credits,
                productName: `${intent.credits} Premium Backlink Credits`,
                isGuest: false
              }
            );
          }

          if (result.success && result.url) {
            if (result.method) {
              stripeWrapper.openCheckoutWindow(result.url, result.sessionId);
            } else {
              CreditPaymentService.openCheckoutWindow(result.url, result.sessionId);
            }
            toast({ title: '✅ Checkout Resumed', description: 'Please complete your payment in the new window.' });
          } else if (!result.success) {
            toast({ title: 'Checkout Error', description: result.error || 'Could not resume checkout', variant: 'destructive' });
          }
        } else if (intent.type === 'premium') {
          const result = await SubscriptionService.createSubscription(user, false, undefined, intent.plan);
          if (result.success && result.url) {
            const win = window.open(result.url, 'stripe-checkout', 'width=800,height=600,scrollbars=yes,resizable=yes');
            if (!win) window.location.href = result.url;
            toast({ title: '✅ Checkout Resumed', description: 'Please complete your subscription in the new window.' });
          } else if (!result.success) {
            toast({ title: 'Checkout Error', description: result.error || 'Could not resume subscription', variant: 'destructive' });
          }
        }
      } catch (error: any) {
        toast({ title: 'Checkout Error', description: error?.message || 'Unexpected error resuming checkout', variant: 'destructive' });
      } finally {
        clearCheckoutIntent();
        processingRef.current = false;
      }
    };

    process();
  }, [user, toast]);

  return null;
}
