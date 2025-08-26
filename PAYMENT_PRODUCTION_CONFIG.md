# Payment System Production Configuration

## 🚨 URGENT: Configure Real Stripe Keys

Your payment system is currently in **DEMO MODE** because placeholder Stripe keys are being used.

## Current Status
- ✅ All payment code is implemented and working
- ✅ Netlify functions are deployed
- ✅ UI components are ready
- ❌ **Need real Stripe production keys**

## Step 1: Get Your Stripe Keys

1. Go to https://dashboard.stripe.com/
2. **Switch to LIVE mode** (toggle in top left)
3. Go to **Developers** → **API keys**
4. Copy your **Publishable key** (starts with `pk_live_`)
5. Copy your **Secret key** (starts with `sk_live_`)

## Step 2: Set Environment Variables in Netlify

In your Netlify dashboard:

1. Go to **Site settings** → **Environment variables**
2. Add these variables:

```
VITE_STRIPE_PUBLISHABLE_KEY=pk_live_YOUR_ACTUAL_KEY_HERE
STRIPE_SECRET_KEY=sk_live_YOUR_ACTUAL_SECRET_KEY_HERE
```

## Step 3: Redeploy Your Site

After setting the environment variables, trigger a new deployment.

## Step 4: Test Real Payments

Visit your deployed site at: `your-domain.com/payment-test`

## How It Works Now

### Credit Purchases
- 50 Credits: $70
- 100 Credits: $140  
- 250 Credits: $350
- 500 Credits: $700

### Premium Subscriptions
- Monthly: $29/month
- Yearly: $290/year

### Payment Flow
1. User clicks purchase button
2. New window opens to Stripe Checkout
3. User enters credit card info
4. Payment processed by Stripe
5. User redirected back to your site
6. Credits/subscription activated

## Security Features Already Implemented

✅ Rate limiting (10 requests/minute for payments)
✅ Input sanitization and validation
✅ CORS protection
✅ Secure environment variable handling
✅ Guest checkout support
✅ Order tracking in database

## Test Cards (for testing only)

When using test keys (`pk_test_`), you can use:
- **4242 4242 4242 4242** (Visa - succeeds)
- **4000 0000 0000 0002** (Declined)
- Use any future expiry date and any 3-digit CVC

## Production Checklist

- [ ] Set `VITE_STRIPE_PUBLISHABLE_KEY` to your live key
- [ ] Set `STRIPE_SECRET_KEY` to your live secret key  
- [ ] Redeploy site
- [ ] Test payment flow at `/payment-test`
- [ ] Configure webhooks in Stripe dashboard
- [ ] Test real credit card transaction

## Webhook Configuration (Optional)

For advanced order tracking, configure webhooks in Stripe:

1. Go to **Developers** → **Webhooks** in Stripe
2. Add endpoint: `your-domain.com/.netlify/functions/stripe-webhook`
3. Select events: `checkout.session.completed`, `payment_intent.succeeded`

## Need Help?

The payment system is fully implemented and production-ready. You just need to:

1. **Set real Stripe keys in Netlify environment**
2. **Redeploy the site**
3. **Test at `/payment-test`**

Once you do this, all payments will work with real credit cards in production!
