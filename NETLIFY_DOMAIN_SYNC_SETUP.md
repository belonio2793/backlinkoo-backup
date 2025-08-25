# Netlify-to-Supabase Domain Sync Setup Guide

This guide will help you set up automatic domain synchronization between Netlify and Supabase to prevent duplicate rows and keep your domains in sync.

## 🔧 Prerequisites

1. ✅ Domains table created in Supabase (already done)
2. ✅ Netlify site with domain aliases configured
3. 🔄 **Netlify Personal Access Token** (need to set up)
4. 🔄 **Environment variables configured** (need to set up)

## 📋 Step 1: Get Your Netlify Personal Access Token

1. Go to [Netlify Account Settings](https://app.netlify.com/user/applications#personal-access-tokens)
2. Click **"New access token"**
3. Give it a name like "Supabase Domain Sync"
4. Click **"Generate token"**
5. **Copy the token** (you won't see it again!)

## 🔑 Step 2: Configure Environment Variables

You need to add these environment variables to your **Netlify site settings**:

### In Netlify Dashboard:
1. Go to your site → **Site settings** → **Environment variables**
2. Add these variables:

```bash
# Required for Netlify API access
NETLIFY_ACCESS_TOKEN=your-personal-access-token-here

# Your Netlify site ID (already configured)
NETLIFY_SITE_ID=ca6261e6-0a59-40b5-a2bc-5b5481ac8809

# Supabase credentials (should already be set)
VITE_SUPABASE_URL=your-supabase-url
VITE_SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

### Get Your Supabase Service Role Key:
1. Go to your [Supabase Dashboard](https://supabase.com/dashboard)
2. Select your project → **Settings** → **API**
3. Copy the **service_role** key (not the anon key)

## 🚀 Step 3: How the Sync Works

### Automatic Detection
The system automatically:
- ✅ Detects domains in your Netlify site
- ✅ Compares with domains in Supabase
- ✅ Prevents duplicate entries
- ✅ Updates verification status

### Manual Sync
Use the **"Sync from Netlify"** button in your domains page to:
- Fetch all domain aliases from Netlify
- Add missing domains to Supabase  
- Update verification status for existing domains
- Show detailed sync results

## 📊 Step 4: Using the Enhanced Domains Page

Navigate to `/domains` to access:

### Dashboard Features:
- **Supabase Domains**: Count of domains in your database
- **Netlify Domains**: Count of domains in Netlify (live data)
- **Synced**: Domains that exist in both systems
- **Issues**: Domains with errors

### Sync Actions:
- **Add Domain**: Add new domain to both systems
- **Sync from Netlify**: Import existing Netlify domains
- **Refresh**: Reload domain data

### Connection Status:
- ✅ **Connected**: Netlify API accessible, sync available
- ❌ **Not Connected**: Check environment variables
- 🔄 **Sync Available**: New domains found in Netlify

## ⚡ Step 5: Test the Sync

1. **Check Connection**: Visit `/domains` - you should see "Netlify Connection: ✅ Connected"

2. **Test Manual Sync**: Click "Sync from Netlify" button

3. **Expected Results**:
   ```
   ✅ Sync completed! Added X, updated Y, skipped Z
   ➕ Added domains: example1.com, example2.com
   🔄 Updated domains: example3.com
   ```

## 🛠️ Troubleshooting

### "Netlify Connection: ❌ Not Connected"
- Check `NETLIFY_ACCESS_TOKEN` in environment variables
- Verify token has correct permissions
- Ensure `NETLIFY_SITE_ID` is correct

### "Failed to fetch domains from Netlify"
- Token may be expired or invalid
- Site ID may be incorrect
- Check network connectivity

### "Failed to sync to Supabase"
- Check `VITE_SUPABASE_SERVICE_ROLE_KEY`
- Verify RLS policies allow authenticated users
- Check Supabase project status

### Domains Not Syncing
- Ensure domains table exists in Supabase
- Check user_id matches between systems
- Verify domain format is valid

## 🔄 Sync Behavior

### Safe Mode (Default)
- Only adds missing domains
- Updates verification status
- Skips existing domains
- No destructive operations

### What Gets Synced
- ✅ Domain name
- ✅ Netlify verification status  
- ✅ Site ID reference
- ✅ SSL status (assumed active)
- ✅ Custom domain flag

### What Doesn't Get Synced
- ❌ User-added domains not in Netlify
- ❌ Domain deletions (manual only)
- ❌ Custom DNS records
- ❌ User preferences

## 📈 Advanced Features

### Real-time Updates
- Domain changes update live across tabs
- Automatic refresh on sync completion
- Toast notifications for all actions

### Duplicate Prevention
- Domain uniqueness enforced by database
- Case-insensitive domain matching
- Automatic domain cleanup (www, protocols)

### Error Handling
- Detailed error messages
- Partial sync recovery
- Non-blocking error reporting

## 🎯 Next Steps

After setup is complete:

1. **Regular Sync**: Use "Sync from Netlify" when you add domains in Netlify
2. **Monitor Status**: Check connection status indicator
3. **Add Domains**: Use the enhanced UI for new domain management
4. **Automate**: Consider setting up webhooks for automatic sync (advanced)

---

## 🔗 Related Files

- **Frontend**: `/src/pages/EnhancedDomainsPage.tsx`
- **Sync Service**: `/src/services/netlifyDomainSync.ts`  
- **Netlify Function**: `/netlify/functions/sync-domains-from-netlify.js`
- **Database**: Use SQL from `create-domains-table.sql`

Your domain management system is now ready for seamless Netlify-Supabase synchronization! 🎉
