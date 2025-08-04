# Subscription System Debug Guide

## Current Error
```
Subscription creation error: Edge Function returned a non-2xx status code [object Object]
```

## Quick Debug Steps

### 1. Check Browser Console
Open browser dev tools and run:
```javascript
// Test the subscription system
window.debugSubscription()

// Or test specific parts
window.SubscriptionDebugger.testEdgeFunction()
```

### 2. Environment Variables Required

Your Supabase Edge Function needs these environment variables set in the Supabase dashboard:

**Go to: Supabase Dashboard → Edge Functions → Environment Variables**

Required variables:
```
STRIPE_SECRET_KEY=sk_test_... (or sk_live_... for production)
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJ... (service role key, not anon key)
```

### 3. Development Fallback Mode

If Stripe isn't configured yet, you can enable fallback mode by:

1. Adding this to your `.env` file:
```
VITE_USE_SUBSCRIPTION_FALLBACK=true
```

2. Or simply click "Upgrade Now" in development - it will offer a fallback option

### 4. Manual Premium Upgrade (For Testing)

Run this SQL in Supabase SQL Editor to manually upgrade yourself:
```sql
-- Replace 'your-email@example.com' with your actual email
UPDATE profiles 
SET 
    role = 'premium',
    subscription_status = 'active',
    subscription_tier = 'premium'
WHERE email = 'your-email@example.com';
```

### 5. Check Edge Function Logs

1. Go to Supabase Dashboard
2. Navigate to Edge Functions → create-subscription
3. Click on "Logs" tab
4. Look for error messages when you try to subscribe

### 6. Test Edge Function Directly

In browser console:
```javascript
// Test the edge function with a simple call
supabase.functions.invoke('create-subscription', {
  body: { test: true }
}).then(result => console.log('Edge function test:', result))
```

## Common Issues & Solutions

### Issue: "STRIPE_SECRET_KEY not found"
**Solution:** Add your Stripe secret key to Supabase environment variables

### Issue: "Rate limit exceeded" 
**Solution:** Wait 1 minute and try again, or restart your development server

### Issue: "User not authenticated"
**Solution:** Make sure you're logged in, or use guest checkout

### Issue: Edge function not deployed
**Solution:** Redeploy your edge functions:
```bash
supabase functions deploy create-subscription
```

## Development Mode Features

- ✅ Fallback subscription (instant premium upgrade)
- ✅ Detailed error logging in console
- ✅ Debug utilities available globally
- ✅ Safe testing without real payments

## Next Steps

1. **If you want real Stripe integration:** Configure the environment variables above
2. **If you want to test quickly:** Use the fallback mode or manual SQL upgrade
3. **If you're debugging:** Use the browser console tools provided

The system is designed to work in both development and production environments!
