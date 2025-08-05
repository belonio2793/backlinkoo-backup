# Netlify Payment Integration Setup

This guide will help you set up Stripe and PayPal payment integration using Netlify environment variables.

## Required Environment Variables

### Netlify Site Dashboard Setup

Go to your Netlify site dashboard: **Site settings > Environment variables**

### Frontend Environment Variables (Exposed to Client)

```bash
# Stripe Configuration
VITE_STRIPE_PUBLISHABLE_KEY=pk_test_xxxxx...    # Your Stripe publishable key
VITE_PAYPAL_CLIENT_ID=sb_xxxxx...               # Your PayPal client ID

# Environment Detection
VITE_ENVIRONMENT=development                     # Options: development, preview, production
```

### Backend Environment Variables (Netlify Functions Only)

```bash
# Stripe Configuration
STRIPE_SECRET_KEY=sk_test_xxxxx...               # Your Stripe secret key
STRIPE_WEBHOOK_SECRET=whsec_xxxxx...             # Your Stripe webhook secret (optional)

# PayPal Configuration  
PAYPAL_CLIENT_ID=sb_xxxxx...                     # Your PayPal client ID (duplicate for functions)
PAYPAL_SECRET_KEY=xxxxx...                       # Your PayPal secret key

# Supabase Configuration (for database syncing)
VITE_SUPABASE_URL=https://xxxxx.supabase.co     # Your Supabase URL
SUPABASE_SERVICE_ROLE_KEY=xxxxx...               # Your Supabase service role key
```

## Step-by-Step Setup

### 1. Stripe Setup

1. **Create/Login to Stripe Account**
   - Go to [Stripe Dashboard](https://dashboard.stripe.com)
   - Create account or sign in

2. **Get API Keys**
   - Navigate to **Developers > API Keys**
   - Copy **Publishable key** (starts with `pk_`)
   - Copy **Secret key** (starts with `sk_`)

3. **Set up Webhook (Optional but Recommended)**
   - Go to **Developers > Webhooks**
   - Click **Add endpoint**
   - Endpoint URL: `https://your-site.netlify.app/api/webhook/stripe`
   - Select events: `checkout.session.completed`, `invoice.payment_succeeded`, `customer.subscription.deleted`
   - Copy the webhook secret

### 2. PayPal Setup

1. **Create PayPal Developer Account**
   - Go to [PayPal Developer](https://developer.paypal.com)
   - Create account or sign in

2. **Create Application**
   - Navigate to **My Apps & Credentials**
   - Click **Create App**
   - Choose **Default Application**
   - Select **Sandbox** for testing, **Live** for production

3. **Get Credentials**
   - Copy **Client ID**
   - Copy **Secret**

### 3. Netlify Configuration

1. **Add Environment Variables**
   ```
   Site settings > Environment variables > Add variable
   ```

2. **Frontend Variables** (exposed to client):
   ```
   VITE_STRIPE_PUBLISHABLE_KEY = pk_test_xxxxx...
   VITE_PAYPAL_CLIENT_ID = sb_xxxxx...
   VITE_ENVIRONMENT = development
   ```

3. **Backend Variables** (Netlify functions only):
   ```
   STRIPE_SECRET_KEY = sk_test_xxxxx...
   STRIPE_WEBHOOK_SECRET = whsec_xxxxx...
   PAYPAL_CLIENT_ID = sb_xxxxx...
   PAYPAL_SECRET_KEY = xxxxx...
   ```

4. **Deploy Site**
   - Trigger a new deployment to apply environment variables
   - Environment variables take effect after deployment

### 4. Database Setup (Supabase)

1. **Create Required Tables**

```sql
-- Orders table for payment tracking
CREATE TABLE IF NOT EXISTS orders (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id),
  email TEXT NOT NULL,
  stripe_session_id TEXT,
  paypal_order_id TEXT,
  amount INTEGER NOT NULL,
  credits INTEGER DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'pending',
  payment_method TEXT NOT NULL,
  product_name TEXT,
  guest_checkout BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Subscribers table for subscription tracking
CREATE TABLE IF NOT EXISTS subscribers (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id),
  email TEXT UNIQUE NOT NULL,
  stripe_customer_id TEXT,
  stripe_subscription_id TEXT,
  subscribed BOOLEAN DEFAULT false,
  subscription_tier TEXT,
  subscription_plan TEXT,
  payment_method TEXT,
  guest_checkout BOOLEAN DEFAULT false,
  current_period_start TIMESTAMPTZ,
  current_period_end TIMESTAMPTZ,
  status TEXT,
  canceled_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- User credits table
CREATE TABLE IF NOT EXISTS user_credits (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) UNIQUE,
  credits INTEGER DEFAULT 0,
  total_purchased INTEGER DEFAULT 0,
  total_used INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

2. **Set Row Level Security (RLS)**

```sql
-- Enable RLS
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscribers ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_credits ENABLE ROW LEVEL SECURITY;

-- Orders policies
CREATE POLICY "Users can view their own orders" ON orders
  FOR SELECT USING (auth.uid() = user_id OR email = auth.jwt() ->> 'email');

-- Subscribers policies  
CREATE POLICY "Users can view their own subscription" ON subscribers
  FOR SELECT USING (auth.uid() = user_id OR email = auth.jwt() ->> 'email');

-- User credits policies
CREATE POLICY "Users can view their own credits" ON user_credits
  FOR SELECT USING (auth.uid() = user_id);
```

## Testing the Integration

### 1. Test Environment Variables

Visit your site and check the browser console for any configuration errors. The Enhanced Unified Payment Modal will show available payment methods based on your configuration.

### 2. Test Payment Flow

1. **Credits Purchase Test**:
   - Open the Enhanced Unified Payment Modal
   - Select "Credits" tab
   - Choose a credit package
   - Complete checkout with test credentials

2. **Subscription Test**:
   - Open the Enhanced Unified Payment Modal  
   - Select "Premium" tab
   - Choose monthly or yearly plan
   - Complete checkout with test credentials

### 3. Test Stripe Webhooks

Use Stripe CLI to test webhooks locally:

```bash
stripe listen --forward-to localhost:8888/api/webhook/stripe
stripe trigger checkout.session.completed
```

## Test Credentials

### Stripe Test Cards
```
Visa: 4242424242424242
Mastercard: 5555555555554444
American Express: 378282246310005
Declined: 4000000000000002
```

### PayPal Sandbox
Use PayPal sandbox accounts for testing PayPal integration.

## Production Deployment

### 1. Update Environment Variables

Replace test credentials with live credentials:

```bash
# Stripe Live Keys
VITE_STRIPE_PUBLISHABLE_KEY=pk_live_xxxxx...
STRIPE_SECRET_KEY=sk_live_xxxxx...

# PayPal Live Credentials
VITE_PAYPAL_CLIENT_ID=live_client_id...
PAYPAL_SECRET_KEY=live_secret...

# Environment
VITE_ENVIRONMENT=production
```

### 2. Update Webhook Endpoint

Update Stripe webhook endpoint to your production URL:
```
https://your-production-site.netlify.app/api/webhook/stripe
```

### 3. PayPal Environment

PayPal automatically switches to production based on live credentials.

## Features Supported

✅ **Credit Purchases**: One-time payments for backlink credits
✅ **Premium Subscriptions**: Monthly/yearly premium plan subscriptions  
✅ **Stripe Integration**: Cards, Apple Pay, Google Pay
✅ **PayPal Integration**: PayPal account and PayPal Credit
✅ **Guest Checkout**: Purchase without account registration
✅ **User Checkout**: Integrated with authentication system
✅ **Database Syncing**: Automatic order and subscription tracking
✅ **Webhook Processing**: Real-time payment status updates
✅ **Dynamic Products**: No manual Stripe product creation required

## Troubleshooting

### Common Issues

1. **"Payment methods not configured"**
   - Check that environment variables are set correctly
   - Ensure deployment includes new variables
   - Verify variable names match exactly

2. **"CORS errors"** 
   - Netlify functions automatically handle CORS
   - Check that functions are deployed correctly

3. **"Webhook verification failed"**
   - Ensure STRIPE_WEBHOOK_SECRET is set correctly
   - Check webhook endpoint URL matches deployed site

4. **Database errors**
   - Verify Supabase configuration
   - Check that tables exist and RLS policies are correct
   - Ensure SUPABASE_SERVICE_ROLE_KEY has proper permissions

### Debug Information

Visit `/auth-diagnostic` on your site for comprehensive authentication and payment system diagnostics.

## Support

For payment integration issues:
1. Check browser console for errors
2. Verify environment variables are set
3. Test with provided test credentials
4. Check Netlify function logs in dashboard
5. Use Stripe Dashboard logs for payment debugging
