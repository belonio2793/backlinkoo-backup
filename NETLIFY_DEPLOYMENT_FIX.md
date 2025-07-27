# 🚀 Netlify Deployment Quick Fix

## The Error
Your deployment is failing because Netlify functions require environment variables to be configured **before** deployment.

## ✅ Quick Fix Steps

### 1. **Set Environment Variables in Netlify Dashboard**

1. Go to your Netlify site dashboard
2. Click **Site settings** → **Environment variables**
3. Add these **required** variables:

```bash
# REQUIRED - Database Configuration
SUPABASE_URL=https://dfhanacsmsvvkpunurnp.supabase.co
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRmaGFuYWNzbXN2dmtwdW51cm5wIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Mzc3MDQxMjIsImV4cCI6MjA1MzI4MDEyMn0.Fj4zzWzQIxZ-2Ps-FHk6KeqPjSMwP1gJwqGj_d5K5GM

# REQUIRED - Site URL (URL is reserved in Netlify, use URI)
URI=https://backlinkoo.com
```

### 2. **Optional but Recommended**

```bash
# For AI content generation (will use fallback if missing)
OPENAI_API_KEY=sk-your_openai_api_key_here

# For email notifications (claiming works without it)
RESEND_API_KEY=re_your_resend_api_key_here

# For cleanup function (get from Supabase dashboard → Settings → API)
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here
```

### 3. **Redeploy**

After setting the environment variables:
- Click **Deploy** → **Trigger deploy** in your Netlify dashboard
- OR push a new commit to trigger auto-deployment

## 🎯 Minimum Working Configuration

For the blog widget to work, you **ONLY** need:
1. `SUPABASE_URL` ✅ (already provided)
2. `SUPABASE_ANON_KEY` ✅ (already provided) 
3. `URI` (your site URL - note: URL is reserved in Netlify)

## 🔍 How to Get Missing Keys

### **SUPABASE_SERVICE_ROLE_KEY**
1. Go to [Supabase Dashboard](https://supabase.com/dashboard)
2. Select your project: `dfhanacsmsvvkpunurnp`
3. Go to **Settings** → **API**
4. Copy the **service_role** key (NOT the anon key)

### **OPENAI_API_KEY** (Optional)
1. Go to [OpenAI API](https://platform.openai.com/api-keys)
2. Create a new API key
3. Format: `sk-...`

### **RESEND_API_KEY** (Optional)
1. Go to [Resend Dashboard](https://resend.com/api-keys)
2. Create a new API key  
3. Format: `re_...`

## 🚨 Common Issues

**Issue**: "Missing required environment variables"
**Fix**: Make sure you set the variables in Netlify dashboard, not just locally

**Issue**: "Database not available"
**Fix**: Double-check your SUPABASE_URL and SUPABASE_ANON_KEY are correct

**Issue**: Functions still failing
**Fix**: Clear Netlify cache and redeploy

## ✅ Verification

After deployment, test by:
1. Visiting your site
2. Trying to generate a blog post
3. Checking Netlify function logs for errors

The functions are now protected and will show helpful error messages if environment variables are missing.
