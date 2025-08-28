# 🚀 Edge Function Deployment Guide - Fix Payment Errors

## 🎯 Current Issue
You're getting "Payment system error: Edge Function returned a non-2xx status code" which means the Supabase Edge Functions need to be deployed and configured.

## 📋 Immediate Solution

### **Step 1: Test Edge Functions**
Visit this URL to test your edge functions:
```
https://your-app-url.fly.dev/edge-function-debug
```

This will show you exactly what's wrong with your edge functions.

### **Step 2: Deploy Edge Functions**
Run these commands in your terminal:

```bash
# Deploy all three edge functions
supabase functions deploy create-payment
supabase functions deploy create-subscription  
supabase functions deploy verify-payment
```

### **Step 3: Set Environment Variables**
```bash
# Set your Stripe secret key (REQUIRED)
supabase secrets set STRIPE_SECRET_KEY=sk_live_YOUR_ACTUAL_STRIPE_SECRET_KEY

# Set your Supabase service role key (REQUIRED)
supabase secrets set SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here
```

### **Step 4: Test Again**
After deployment, click "Buy Credits" again - it should work!

## 🔧 Detailed Setup Instructions

### Prerequisites
1. **Supabase CLI installed**: `npm install -g supabase`
2. **Supabase project linked**: `supabase link --project-ref YOUR_PROJECT_REF`
3. **Stripe account** with live keys

### Environment Variables Needed

| Variable | Description | Example | Where to get it |
|----------|-------------|---------|-----------------|
| `STRIPE_SECRET_KEY` | Stripe secret key | `sk_live_51abcd...` | Stripe Dashboard → API Keys |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase service key | `eyJhbGciOiJIUzI1...` | Supabase Dashboard → Settings → API |

### Setting Environment Variables
```bash
# Required for payments
supabase secrets set STRIPE_SECRET_KEY=sk_live_YOUR_ACTUAL_KEY
supabase secrets set SUPABASE_SERVICE_ROLE_KEY=YOUR_SERVICE_ROLE_KEY

# Optional for enhanced features
supabase secrets set STRIPE_WEBHOOK_SECRET=whsec_YOUR_WEBHOOK_SECRET
supabase secrets set PAYPAL_CLIENT_ID=YOUR_PAYPAL_CLIENT_ID
supabase secrets set PAYPAL_SECRET_KEY=YOUR_PAYPAL_SECRET
```

### Verifying Deployment
```bash
# Check function status
supabase functions list

# Check function logs
supabase functions logs create-payment
supabase functions logs create-subscription
```

## 🧪 Testing Your Setup

### Test 1: Environment Test
```javascript
// In browser console on your app
const { data, error } = await supabase.functions.invoke('create-payment', {
  body: { test: true }
});
console.log({ data, error });
```

### Test 2: Credit Purchase Test
```javascript
// Test credit purchase
const { data, error } = await supabase.functions.invoke('create-payment', {
  body: {
    amount: 70,
    credits: 50,
    productName: "50 Test Credits",
    isGuest: true,
    guestEmail: "test@example.com",
    paymentMethod: "stripe"
  }
});
console.log({ data, error });
// Should return: { data: { url: "https://checkout.stripe.com/...", sessionId: "cs_..." } }
```

### Test 3: Subscription Test
```javascript
// Test subscription
const { data, error } = await supabase.functions.invoke('create-subscription', {
  body: {
    plan: "monthly",
    tier: "premium",
    isGuest: true,
    guestEmail: "test@example.com"
  }
});
console.log({ data, error });
// Should return: { data: { url: "https://checkout.stripe.com/...", sessionId: "cs_..." } }
```

## ❌ Common Errors & Solutions

### "Function not found" (404)
**Problem**: Edge functions not deployed  
**Solution**: Run `supabase functions deploy create-payment`

### "Payment system not configured"
**Problem**: Missing STRIPE_SECRET_KEY  
**Solution**: `supabase secrets set STRIPE_SECRET_KEY=sk_live_YOUR_KEY`

### "Service configuration error"
**Problem**: Missing SUPABASE_SERVICE_ROLE_KEY  
**Solution**: `supabase secrets set SUPABASE_SERVICE_ROLE_KEY=your_key`

### "Live Stripe secret key required"
**Problem**: Using test key in production  
**Solution**: Use `sk_live_` key instead of `sk_test_`

### "Rate limit exceeded"
**Problem**: Too many requests  
**Solution**: Wait 1 minute and try again

## 🎉 Success Indicators

When everything is working, you should see:
- ✅ "Buy Credits" button opens Stripe checkout
- ✅ No error messages in browser console
- ✅ Checkout URL starts with `https://checkout.stripe.com/`
- ✅ Payments process successfully

## 🔗 Quick Links

- **Edge Function Debugger**: `https://your-app-url.fly.dev/edge-function-debug`
- **Supabase Dashboard**: `https://app.supabase.com/project/YOUR_PROJECT`
- **Stripe Dashboard**: `https://dashboard.stripe.com/`
- **Function Logs**: `supabase functions logs create-payment --follow`

## 📞 Need Help?

If you're still having issues:
1. Check the edge function debugger first
2. Verify all environment variables are set
3. Check function logs for detailed errors
4. Ensure you're using live Stripe keys for production

The edge functions are now properly configured with:
- ✅ Live product IDs (`prod_SoVoAb8dXp1cS0` for credits, `prod_SoVja4018pbOcy` for premium)
- ✅ Proper error handling and validation
- ✅ Rate limiting and security
- ✅ Guest and authenticated user support

Just deploy them and set your environment variables! 🚀
