# Email Configuration Fix Guide

## Issues Identified

### 1. RESEND_API_KEY Configuration
- ✅ API key exists in SecureConfig: `re_f2ixyRAw_EA1dtQCo9KnANfJgrgqfXFEq`
- ❌ May not be set in Supabase project environment variables
- ❌ Multiple services trying to access key from different sources

### 2. Supabase Auth Configuration
- ❌ No custom email templates configured
- ❌ Default Supabase email service not connected to Resend
- ❌ Auth redirect URLs may not match

### 3. Service Conflicts
- ❌ Multiple email services: Direct Resend, Netlify Functions, Supabase Edge Functions
- ❌ Mock mode potentially interfering with real delivery
- ❌ Inconsistent error handling across services

## Immediate Fixes Required

### Step 1: Configure Supabase Environment Variables
```bash
# In Supabase Dashboard > Project Settings > Environment Variables
RESEND_API_KEY=re_f2ixyRAw_EA1dtQCo9KnANfJgrgqfXFEq
```

### Step 2: Set Up Supabase Auth Email Templates
1. Go to Supabase Dashboard > Authentication > Email Templates
2. Configure "Confirm signup" template:
   - Subject: `Confirm your email - Backlink ∞`
   - Body: Custom HTML template with proper redirect URL
   - Redirect URL: `https://backlinkoo.com/auth/confirm`

### Step 3: Deploy Supabase Edge Functions
```bash
# Deploy the email function
supabase functions deploy send-email-resend
supabase functions deploy send-test-email
```

### Step 4: Test Email Delivery
```bash
# Test the email system
npm run admin:test
```

## Environment Variables Checklist

### Supabase Project Settings
- [ ] `RESEND_API_KEY` set in environment variables
- [ ] Email templates configured with correct redirect URLs
- [ ] Domain verification completed in Resend dashboard

### Netlify Environment Variables (if using Netlify functions)
- [ ] `RESEND_API_KEY` set
- [ ] `VITE_SUPABASE_URL` set
- [ ] `VITE_SUPABASE_ANON_KEY` set

## Testing Steps

1. **Test Resend API Connection:**
   ```bash
   curl -X GET "https://api.resend.com/domains" \
     -H "Authorization: Bearer re_f2ixyRAw_EA1dtQCo9KnANfJgrgqfXFEq"
   ```

2. **Test User Registration:**
   - Create new user account
   - Check browser network tab for email API calls
   - Verify email is sent to inbox (check spam folder)

3. **Test Email Confirmation:**
   - Click confirmation link in email
   - Verify user can login successfully

## Common Issues & Solutions

### Issue: "Email not confirmed" error
**Solution:** Check if confirmation emails are being sent and URLs are correct

### Issue: Email functions timeout
**Solution:** Verify RESEND_API_KEY is set in Supabase environment variables

### Issue: Emails go to spam
**Solution:** Configure SPF/DKIM records for your domain in Resend dashboard

### Issue: Multiple email services conflict
**Solution:** Use only one email service (recommend Supabase + Resend)

## Next Steps

1. Set environment variables in Supabase
2. Configure email templates
3. Test with real user registration
4. Monitor email delivery in Resend dashboard
