# Stripe Production Setup Guide

## Current Status
- System is in DEMO MODE due to placeholder Stripe keys
- All payment functionality exists and works correctly
- Need real Stripe keys for live processing

## Required Environment Variables

Set these in your Netlify deployment settings:

### Required for Live Payments:
```bash
STRIPE_SECRET_KEY=sk_live_your_actual_stripe_secret_key_here
VITE_STRIPE_PUBLISHABLE_KEY=pk_live_your_actual_stripe_publishable_key_here
```

### Optional (for predefined price objects):
```bash
VITE_STRIPE_MONTHLY_PRICE_ID=price_your_monthly_price_id
VITE_STRIPE_YEARLY_PRICE_ID=price_your_yearly_price_id
```

## How to Get Your Stripe Keys

1. **Go to Stripe Dashboard**: https://dashboard.stripe.com/
2. **For LIVE keys**: Make sure you're viewing "Live data" (not test mode)
3. **Get Publishable Key**: 
   - Go to Developers → API keys
   - Copy "Publishable key" (starts with `pk_live_`)
4. **Get Secret Key**:
   - Copy "Secret key" (starts with `sk_live_`)
   - Keep this secure - never commit to code!

## Test Current System

Visit: `/payment-test` to test all payment functionality

## Features Ready for Production

✅ Credit purchases (50, 100, 250, 500 credits)
✅ Premium subscriptions (monthly/yearly)
✅ Guest checkout support
✅ New window redirect to Stripe
✅ Proper error handling and fallbacks
✅ Order tracking in database
✅ Webhook verification
✅ Rate limiting and security

## Next Steps

1. Set real Stripe keys in Netlify environment
2. Test with `/payment-test` page
3. Verify webhooks are configured in Stripe dashboard
4. Test a real transaction

## Production Checklist

- [ ] Real Stripe keys set in Netlify
- [ ] Webhooks configured in Stripe dashboard  
- [ ] SSL certificate active on domain
- [ ] Payment flows tested with real cards
- [ ] Subscription management tested
