# Live Stripe Integration Configuration Guide

## 🚀 PRODUCTION SETUP FOR BACKLINKOO.COM

This guide will help you configure live Stripe integration for production payments using the provided product IDs.

## 📋 Required Environment Variables

### 1. Stripe Core Configuration (Required)

Set these in your **Netlify Dashboard** under Site Settings > Environment Variables:

```
STRIPE_SECRET_KEY=sk_live_YOUR_ACTUAL_LIVE_SECRET_KEY
VITE_STRIPE_PUBLISHABLE_KEY=pk_live_YOUR_ACTUAL_LIVE_PUBLISHABLE_KEY
STRIPE_WEBHOOK_SECRET=whsec_YOUR_ACTUAL_WEBHOOK_SECRET
```

### 2. Premium Plan Configuration

The system is now hardcoded to use your live product IDs:
- **Credits Product ID**: `prod_SoVoAb8dXp1cS0`
- **Premium Plan Product ID**: `prod_SoVja4018pbOcy`

You need to create prices for your premium product in Stripe Dashboard:

```
STRIPE_PREMIUM_PLAN_MONTHLY=price_YOUR_MONTHLY_PRICE_ID
STRIPE_PREMIUM_PLAN_ANNUAL=price_YOUR_ANNUAL_PRICE_ID
VITE_STRIPE_PREMIUM_PLAN_MONTHLY=price_YOUR_MONTHLY_PRICE_ID
VITE_STRIPE_PREMIUM_PLAN_ANNUAL=price_YOUR_ANNUAL_PRICE_ID
```

## 🔧 Stripe Dashboard Setup

### Step 1: Create Live Prices for Premium Product

1. **Login to Stripe Dashboard**: https://dashboard.stripe.com
2. **Go to Products**: Find product `prod_SoVja4018pbOcy`
3. **Create Monthly Price**:
   - Amount: $29.00 USD
   - Billing Period: Monthly
   - Copy the price ID (starts with `price_`)
4. **Create Annual Price**:
   - Amount: $290.00 USD
   - Billing Period: Yearly
   - Copy the price ID (starts with `price_`)

### Step 2: Configure Webhooks

1. **Go to Webhooks** in Stripe Dashboard
2. **Create endpoint**: `https://backlinkoo.com/.netlify/functions/payment-webhook`
3. **Select events**:
   - `checkout.session.completed`
   - `invoice.payment_succeeded`
   - `customer.subscription.created`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
4. **Copy webhook secret** (starts with `whsec_`)

## 🌐 Netlify Environment Variables Setup

### Complete Environment Variables List:

```bash
# Stripe Core (Live Keys)
STRIPE_SECRET_KEY=sk_live_YOUR_ACTUAL_SECRET_KEY
VITE_STRIPE_PUBLISHABLE_KEY=pk_live_YOUR_ACTUAL_PUBLISHABLE_KEY
STRIPE_WEBHOOK_SECRET=whsec_YOUR_ACTUAL_WEBHOOK_SECRET

# Premium Plan Prices (Create these in Stripe Dashboard)
STRIPE_PREMIUM_PLAN_MONTHLY=price_YOUR_MONTHLY_PRICE_ID
STRIPE_PREMIUM_PLAN_ANNUAL=price_YOUR_ANNUAL_PRICE_ID
VITE_STRIPE_PREMIUM_PLAN_MONTHLY=price_YOUR_MONTHLY_PRICE_ID
VITE_STRIPE_PREMIUM_PLAN_ANNUAL=price_YOUR_ANNUAL_PRICE_ID

# Supabase (Existing - Keep Current Values)
SUPABASE_URL=https://dfhanacsmsvvkpunurnp.supabase.co
SUPABASE_SERVICE_ROLE_KEY=YOUR_CURRENT_SERVICE_ROLE_KEY
VITE_SUPABASE_URL=https://dfhanacsmsvvkpunurnp.supabase.co
VITE_SUPABASE_ANON_KEY=YOUR_CURRENT_ANON_KEY
```

## 🔐 Security Notes

1. **Never commit live keys** to repository
2. **Use test keys** (`sk_test_`, `pk_test_`) for development
3. **Use live keys** (`sk_live_`, `pk_live_`) only in production
4. **Rotate keys** if compromised

## 📊 Payment Flow Configuration

### Credits Pricing (Hardcoded in Frontend)
- 50 Credits: $70.00 ($1.40 per credit)
- 100 Credits: $140.00 ($1.40 per credit)
- 250 Credits: $350.00 ($1.40 per credit)
- 500 Credits: $700.00 ($1.40 per credit)
- Custom amounts: $1.40 per credit

### Premium Plans (Configure in Stripe)
- Monthly: $29.00/month
- Annual: $290.00/year (equivalent to $24.17/month)

## ✅ Validation Script

Run this to verify your configuration:

```bash
node validate-stripe-environment.js
```

## 🚀 Deployment Steps

1. **Set all environment variables** in Netlify Dashboard
2. **Deploy your site** to apply changes
3. **Test payments** with live Stripe test cards:
   - Test Card: `4242 4242 4242 4242`
   - Any future expiry date
   - Any 3-digit CVC

## 🆘 Support

If you encounter issues:
1. Check Netlify Function logs
2. Verify Stripe webhook deliveries
3. Ensure all environment variables are set correctly
4. Confirm product IDs exist in your Stripe account

## 🎯 Current System Status

- ✅ Edge Functions updated with live product IDs
- ✅ Demo/test components removed
- ✅ Fallback services disabled
- ⏳ Environment variables need live values
- ⏳ Premium pricing needs Stripe Dashboard setup

## 🔄 What Happens Next

1. You set the live Stripe keys in Netlify
2. Create premium prices in Stripe Dashboard
3. Configure webhook endpoint
4. Test live payments
5. Monitor in Stripe Dashboard

---

**Note**: The placeholder values have been set in your development environment. Replace them with actual live values in your Netlify production environment.
