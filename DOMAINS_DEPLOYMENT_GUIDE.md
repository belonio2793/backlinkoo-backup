# Domain Management System - Deployment Guide

## Overview
Complete two-way domain synchronization system between Supabase and Netlify.

## Architecture
- **Frontend**: React page at `/domains` 
- **Backend**: Supabase Edge Function `netlify-domains`
- **Database**: Supabase `domains` table
- **API Integration**: Netlify Sites API

## Environment Variables

### Frontend (.env or Netlify environment)
```bash
VITE_SUPABASE_URL=https://dfhanacsmsvvkpunurnp.supabase.co
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
VITE_NETLIFY_SITE_ID=ca6261e6-0a59-40b5-a2bc-5b5481ac8809
```

### Supabase Edge Functions
```bash
SUPABASE_URL=https://dfhanacsmsvvkpunurnp.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
NETLIFY_ACCESS_TOKEN=your_personal_netlify_token
NETLIFY_SITE_ID=ca6261e6-0a59-40b5-a2bc-5b5481ac8809
```

## Getting Required Keys

### Supabase Keys
1. **SUPABASE_URL**: Dashboard > Settings > API > Project URL
2. **SUPABASE_ANON_KEY**: Dashboard > Settings > API > anon public key
3. **SUPABASE_SERVICE_ROLE_KEY**: Dashboard > Settings > API > service_role key (for Edge Functions only)

### Netlify Keys
1. **NETLIFY_SITE_ID**: Site Settings > General > App ID (`ca6261e6-0a59-40b5-a2bc-5b5481ac8809`)
2. **NETLIFY_ACCESS_TOKEN**: User Settings > Applications > Personal access tokens > Generate new token

## Deployment Steps

### 1. Deploy Supabase Edge Function
```bash
# From your project root
supabase functions deploy netlify-domains

# Set environment variables
supabase secrets set NETLIFY_ACCESS_TOKEN=your_token
supabase secrets set NETLIFY_SITE_ID=ca6261e6-0a59-40b5-a2bc-5b5481ac8809
```

### 2. Deploy Frontend to Netlify
```bash
# Build the project
npm run build

# Deploy to Netlify (or use Netlify CLI)
netlify deploy --prod

# Set environment variables in Netlify Dashboard:
# Site Settings > Environment Variables
```

### 3. Database Schema
Ensure your Supabase `domains` table has these columns:
```sql
CREATE TABLE domains (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  domain TEXT NOT NULL UNIQUE,
  user_id UUID REFERENCES auth.users(id),
  status TEXT DEFAULT 'pending',
  netlify_verified BOOLEAN DEFAULT false,
  dns_verified BOOLEAN DEFAULT false,
  custom_domain BOOLEAN DEFAULT true,
  ssl_status TEXT DEFAULT 'none',
  error_message TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_sync TIMESTAMP WITH TIME ZONE
);
```

## API Contract

### Edge Function Endpoints

#### Add Domain
```javascript
POST /functions/v1/netlify-domains
{
  "action": "add",
  "domain": "example.com",
  "user_id": "optional_user_id"
}
```

#### Remove Domain
```javascript
POST /functions/v1/netlify-domains
{
  "action": "remove", 
  "domain": "example.com",
  "user_id": "optional_user_id"
}
```

#### Sync Domains
```javascript
POST /functions/v1/netlify-domains
{
  "action": "sync",
  "user_id": "optional_user_id"
}
```

## Testing

### 1. Test Netlify Connection
1. Navigate to `/domains`
2. Check "Netlify Connection" status
3. Click "Test Connection" button

### 2. Test Add Domain
1. Click "Add Domain" 
2. Enter a test domain: `test-domain-123.com`
3. Verify it appears in both:
   - Supabase `domains` table
   - Netlify Site Settings > Domain Management

### 3. Test Remove Domain
1. Click trash icon next to a domain
2. Confirm removal
3. Verify it's removed from both Supabase and Netlify

### 4. Test Sync
1. Manually add a domain in Netlify Dashboard
2. Click "Sync Domains" in the app
3. Verify the domain appears in the interface

## Troubleshooting

### Common Issues

1. **"Netlify Connection: ❌ Not Connected"**
   - Check `NETLIFY_ACCESS_TOKEN` is set in Edge Function environment
   - Verify token has correct permissions
   - Check `NETLIFY_SITE_ID` matches your site

2. **"Failed to add domain"**
   - Check domain format (no protocols, no www)
   - Verify Netlify token permissions
   - Check Edge Function logs in Supabase

3. **"Domain already exists"**
   - Check if domain exists in Supabase table
   - Use "Sync Domains" to reconcile differences

### Debug Commands

```bash
# Check Edge Function logs
supabase functions logs netlify-domains

# Test Edge Function directly
curl -X POST 'https://your-project.supabase.co/functions/v1/netlify-domains' \
  -H 'Authorization: Bearer YOUR_ANON_KEY' \
  -H 'Content-Type: application/json' \
  -d '{"action": "sync"}'

# Check Netlify API directly
curl -X GET 'https://api.netlify.com/api/v1/sites/ca6261e6-0a59-40b5-a2bc-5b5481ac8809' \
  -H 'Authorization: Bearer YOUR_NETLIFY_TOKEN'
```

## Features

✅ **Two-way sync** between Supabase and Netlify  
✅ **Real-time updates** via Supabase subscriptions  
✅ **Domain validation** with instant feedback  
✅ **Error handling** with user-friendly messages  
✅ **Connection testing** for Netlify integration  
✅ **Bulk sync** to reconcile differences  
✅ **Statistics dashboard** showing domain counts  
✅ **Responsive UI** with loading states  

## Security Notes

- ✅ Netlify token is only stored in Edge Function environment
- ✅ Frontend never directly accesses Netlify API  
- ✅ User-scoped domain access with RLS policies
- ✅ Input validation and sanitization
- ✅ Secure error handling without exposing internals

## Support

If you encounter issues:
1. Check environment variables are set correctly
2. Verify API tokens have correct permissions  
3. Check Edge Function logs for detailed errors
4. Test each component individually (database, Edge Function, frontend)
