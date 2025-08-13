# 🔧 Fix Stripe Payments on backlinkoo.com

## 🚨 Most Common Issues & Quick Fixes

### 1. **Missing Environment Variables** (Most Likely Cause)

**Check these in Netlify:**
```bash
# Required Frontend Variables
VITE_STRIPE_PUBLISHABLE_KEY=pk_live_your_production_key
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your_anon_key

# Required Backend Variables (Netlify Functions)
STRIPE_SECRET_KEY=sk_live_your_production_secret
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

**How to Fix:**
1. Go to [Netlify Dashboard](https://app.netlify.com/sites/[your-site]/settings/deploys)
2. Navigate to "Environment variables"
3. Add each variable above
4. Redeploy your site

### 2. **Using Test Keys in Production**

**Problem:** If you see `pk_test_` or `sk_test_` keys on backlinkoo.com
**Fix:** Replace with production keys from Stripe Dashboard

### 3. **Netlify Functions Not Deployed**

**Check if these endpoints work:**
- `https://backlinkoo.com/.netlify/functions/create-payment`
- `https://backlinkoo.com/.netlify/functions/create-subscription`
- `https://backlinkoo.com/.netlify/functions/payment-webhook`

**Fix:** Ensure Netlify functions are building and deploying properly

### 4. **CORS Issues**

**Symptoms:** Network errors when clicking payment buttons
**Fix:** Check that CORS headers are set correctly in Netlify functions

## 🧪 Testing Your Fixes

### Browser Console Test:
```javascript
// Test if Stripe key is configured
console.log('Stripe Key:', window.location.origin, 
  import.meta?.env?.VITE_STRIPE_PUBLISHABLE_KEY ? 'Configured' : 'Missing');

// Test payment endpoint
fetch('/.netlify/functions/create-payment', { method: 'OPTIONS' })
  .then(r => console.log('Payment endpoint:', r.ok ? 'Working' : 'Failed'))
  .catch(e => console.log('Payment endpoint error:', e));
```

### Manual Payment Test:
1. Open browser dev tools
2. Go to a payment page
3. Click a payment button
4. Check Console for errors
5. Check Network tab for failed requests

## 📋 Complete Setup Checklist

### ✅ Environment Variables
- [ ] `VITE_STRIPE_PUBLISHABLE_KEY` configured in Netlify
- [ ] `STRIPE_SECRET_KEY` configured in Netlify  
- [ ] `VITE_SUPABASE_URL` configured in Netlify
- [ ] `VITE_SUPABASE_ANON_KEY` configured in Netlify
- [ ] `SUPABASE_SERVICE_ROLE_KEY` configured in Netlify

### ✅ Stripe Configuration
- [ ] Using production keys (pk_live_, sk_live_) for backlinkoo.com
- [ ] Webhook endpoints configured in Stripe Dashboard
- [ ] Payment methods enabled (card payments)

### ✅ Netlify Functions
- [ ] Functions building without errors
- [ ] Functions deploying successfully
- [ ] Functions accessible via HTTPS

### ✅ Database Setup
- [ ] Supabase connection working
- [ ] Required tables exist (orders, subscribers, etc.)
- [ ] Database permissions configured

## 🔍 Debugging Tools

### Built-in Debugger:
Visit `/payment-debug` on your site to run automated diagnostics.

### Console Commands:
```javascript
// Run comprehensive diagnostics
debugPayments()

// Quick health check
checkPaymentHealth()

// Test endpoints
testPaymentEndpoints()

// Show current config
getPaymentConfig()
```

## 🚨 Emergency Fixes

### If payments are completely broken:

1. **Immediate Check:**
   ```bash
   # Check if these return errors:
   curl -I https://backlinkoo.com/.netlify/functions/create-payment
   curl -I https://backlinkoo.com/.netlify/functions/create-subscription
   ```

2. **Verify Stripe Keys:**
   - Login to Stripe Dashboard
   - Copy production publishable key (pk_live_...)
   - Copy production secret key (sk_live_...)
   - Add both to Netlify environment variables

3. **Check Build Logs:**
   - Go to Netlify deploys
   - Check for function build errors
   - Look for missing dependencies

4. **Test Basic Function:**
   ```javascript
   fetch('/.netlify/functions/create-payment', {
     method: 'POST',
     headers: {'Content-Type': 'application/json'},
     body: JSON.stringify({
       amount: 1,
       productName: 'Test',
       paymentMethod: 'stripe',
       isGuest: true,
       guestEmail: 'test@example.com'
     })
   }).then(r => r.json()).then(console.log);
   ```

## 📞 Getting Help

If payments are still not working after these fixes:

1. Run the diagnostic tool and copy the report
2. Check Netlify function logs for errors
3. Check Stripe Dashboard for webhook failures
4. Verify all environment variables are set correctly

## 🔗 Useful Links

- [Netlify Environment Variables](https://docs.netlify.com/configure-builds/environment-variables/)
- [Stripe API Keys](https://stripe.com/docs/keys)
- [Supabase API Settings](https://supabase.com/dashboard/project/_/settings/api)
- [Netlify Functions](https://docs.netlify.com/functions/overview/)
