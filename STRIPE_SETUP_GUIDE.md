# 🚀 Stripe Live Payment Setup Guide

This guide will help you configure live Stripe payments for your application.

## Required Environment Variables

You need to set these environment variables in your production environment (Netlify, Vercel, etc.):

### 1. Stripe API Keys
```bash
VITE_STRIPE_PUBLISHABLE_KEY=pk_live_YOUR_ACTUAL_KEY_HERE
STRIPE_SECRET_KEY=sk_live_YOUR_ACTUAL_KEY_HERE
STRIPE_WEBHOOK_SECRET=whsec_YOUR_ACTUAL_SECRET_HERE
```

### 2. Stripe Price IDs (Optional - will create dynamic prices if not set)
```bash
STRIPE_MONTHLY_PRICE_ID=price_YOUR_MONTHLY_PRICE_ID
STRIPE_YEARLY_PRICE_ID=price_YOUR_YEARLY_PRICE_ID
```

## Step-by-Step Setup

### Step 1: Get Your Stripe Keys
1. Go to [Stripe Dashboard](https://dashboard.stripe.com/apikeys)
2. Switch to **Live mode** (toggle in top right)
3. Copy your **Publishable key** (starts with `pk_live_`)
4. Reveal and copy your **Secret key** (starts with `sk_live_`)

### Step 2: Set Up Webhook Endpoint
1. Go to [Stripe Webhooks](https://dashboard.stripe.com/webhooks)
2. Click **Add endpoint**
3. Set endpoint URL to: `https://your-domain.com/.netlify/functions/payment-webhook`
4. Select these events:
   - `checkout.session.completed`
   - `invoice.payment_succeeded`
   - `customer.subscription.deleted`
   - `invoice.payment_failed`
5. Copy the **Signing secret** (starts with `whsec_`)

### Step 3: Create Products and Prices (Optional)
1. Go to [Stripe Products](https://dashboard.stripe.com/products)
2. Create a product for "Premium Subscription"
3. Add two prices:
   - Monthly: $29/month
   - Yearly: $290/year
4. Copy the price IDs (start with `price_`)

### Step 4: Configure Environment Variables

#### For Netlify:
1. Go to your Netlify site dashboard
2. Navigate to **Site settings** → **Environment variables**
3. Add each variable with its value

#### For Vercel:
1. Go to your Vercel project dashboard
2. Navigate to **Settings** → **Environment Variables**
3. Add each variable with its value

#### For Local Development:
Update your `.env` file with the actual values (be careful not to commit real keys to version control).

## Testing Your Setup

1. Deploy your changes
2. Try making a test purchase
3. Check Stripe Dashboard for the transaction
4. Verify webhooks are being received

## Security Notes

- ✅ **Do**: Set keys as environment variables in your hosting platform
- ✅ **Do**: Use live keys for production
- ❌ **Don't**: Commit real API keys to your repository
- ❌ **Don't**: Use test keys in production

## Pricing Structure

The application is configured with these default prices:

### Credits (One-time purchase)
- $1.40 per credit
- Packages: 50, 100, 250, 500 credits
- Custom amounts supported

### Premium Subscription
- **Monthly**: $29/month (was $49 - 41% off)
- **Yearly**: $290/year (was $588 - 51% off, save $298)

### Features Included
- ♾️ Unlimited Backlinks
- 🎓 Complete SEO Academy (50+ Lessons) 
- 📊 Advanced Analytics & Reports
- 🛡️ Priority 24/7 Support
- ✅ White-Hat Guarantee
- 🎯 Custom Campaign Strategies
- 📜 Professional Certifications
- 🔌 API Access & Integrations

## Troubleshooting

### Common Issues:

**"Stripe configuration missing"**
- Check that all environment variables are set correctly
- Ensure keys start with the correct prefixes (`pk_live_`, `sk_live_`)

**"Payment verification failed"**
- Verify webhook endpoint is configured correctly
- Check that webhook secret is set properly
- Ensure webhook is receiving events in Stripe Dashboard

**"Invalid amount"** 
- Amounts must be between $0.01 and $100,000
- Check that credits and pricing calculations are correct

### Support
If you need help with Stripe setup, contact [Stripe Support](https://support.stripe.com/) or check their [documentation](https://stripe.com/docs).
