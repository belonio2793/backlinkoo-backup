# Domains Integration Guide

## Overview

This guide explains how the `/domains` page has been enhanced with the ChatGPT conversation implementation for automated domain management with Netlify and Supabase synchronization.

## What Changed

### 1. Updated Page Title and Tagline

**Before:**
- Title: "Enhanced Domain Manager"
- Tagline: "Add domains to Netlify with DNS setup instructions and validation"

**After:**
- Title: "Automation Link Building Domains"
- Tagline: "Add domains for publishing across diversified backlink profile using our content generation and campaigns management system"

### 2. Enhanced Netlify-Domains Function

The existing `supabase/functions/netlify-domains/index.ts` has been enhanced to:

- **GET**: Fetch domains from Netlify API and automatically sync them to Supabase database
- **POST**: Add new domains to Netlify and sync to database
- **DELETE**: Remove domains from both Netlify and database
- **Database Sync**: All operations now update the local Supabase `domains` table

### 3. Database Schema

New `domains` table with the following structure:

```sql
create table domains (
  id uuid default uuid_generate_v4() primary key,
  name text not null unique,            -- domain name (ex: example.com)
  site_id text,                         -- Netlify site ID
  source text default 'manual',         -- 'manual' or 'netlify'
  status text default 'active',         -- 'active', 'pending', 'verified', 'unverified', 'error'
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);
```

## Architecture Flow

```
Frontend (/domains page)
    ↓
Supabase Edge Function (netlify-domains)
    ↓ ↑
Netlify API ←→ Supabase Database
```

## Files Created/Modified

### New Files

1. **`scripts/create-domains-table.sql`** - Database schema
2. **`scripts/setup-domains-database.js`** - Database setup script
3. **`src/utils/domainsApiHelper.ts`** - Frontend API helper
4. **`src/components/domains/EnhancedDomainsIntegration.tsx`** - Integration example
5. **`DOMAINS_INTEGRATION_GUIDE.md`** - This guide

### Modified Files

1. **`src/components/domains/EnhancedDomainManager.tsx`** - Updated title and tagline
2. **`supabase/functions/netlify-domains/index.ts`** - Enhanced with database sync

## How to Use

### 1. Database Setup

Run the database setup script:

```bash
node scripts/setup-domains-database.js
```

Or manually execute the SQL:

```bash
# Copy contents of scripts/create-domains-table.sql
# Run in Supabase SQL Editor
```

### 2. Frontend Integration

The enhanced domains functionality can be used in several ways:

#### Option A: Use the Helper API

```typescript
import { DomainsApiHelper } from '@/utils/domainsApiHelper';

// Sync domains from Netlify
const domains = await DomainsApiHelper.syncDomains();

// Add a new domain
await DomainsApiHelper.addDomain('example.com');

// Fetch from database
const dbDomains = await DomainsApiHelper.fetchDomainsFromDatabase();
```

#### Option B: Direct Function Calls

```typescript
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(/*...*/);

// Sync domains
const { data } = await supabase.functions.invoke('netlify-domains', {
  method: 'GET'
});

// Add domain
await supabase.functions.invoke('netlify-domains', {
  method: 'POST',
  body: { domain: 'example.com' }
});
```

#### Option C: Use the Example Component

Import the example component:

```typescript
import EnhancedDomainsIntegration from '@/components/domains/EnhancedDomainsIntegration';

// In your component
<EnhancedDomainsIntegration />
```

### 3. Testing

Test the integration:

```typescript
// Test connection
const isWorking = await DomainsApiHelper.testConnection();

// Test database
const domains = await DomainsApiHelper.fetchDomainsFromDatabase();
```

## Environment Variables

Make sure these are set in your Supabase Edge Function environment:

```env
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

The Netlify credentials are hardcoded in the function (as per ChatGPT conversation):

```typescript
const NETLIFY_SITE_ID = "ca6261e6-0a59-40b5-a2bc-5b5481ac8809";
const NETLIFY_ACCESS_TOKEN = "nfp_Xngqzk9sydkiKUvfdrqHLSnBCZiH33U8b967";
```

## Error Handling

The system handles several error scenarios:

1. **Network failures**: Retry logic and user-friendly error messages
2. **Database sync failures**: Operations continue even if sync fails
3. **Netlify API errors**: Proper error propagation and logging
4. **Missing environment variables**: Clear error messages

## Security Considerations

1. **Service Role Key**: Used server-side only for database operations
2. **Netlify Token**: Hardcoded as per requirements (consider environment variables for production)
3. **CORS**: Properly configured for cross-origin requests
4. **Input Validation**: Domain names are validated before processing

## Monitoring and Debugging

### Logs

Check logs in:
- Supabase Functions logs for edge function debugging
- Browser console for frontend integration issues
- Network tab for API call debugging

### Debug Helpers

```typescript
// Test connection
await DomainsApiHelper.testConnection();

// Database health check
node scripts/setup-domains-database.js
```

### Common Issues

1. **Function not found**: Deploy the edge function with `supabase functions deploy netlify-domains`
2. **Database errors**: Run the setup script to create tables
3. **CORS errors**: Check function CORS headers configuration
4. **Auth errors**: Verify Supabase service role key

## Production Deployment

### 1. Deploy Edge Function

```bash
supabase functions deploy netlify-domains
```

### 2. Set Environment Variables

In Supabase Dashboard → Project Settings → Functions:

```env
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

### 3. Database Migration

Run the setup script in production environment or execute SQL manually.

### 4. Frontend Build

The frontend helper will automatically use the production Supabase URL from `VITE_SUPABASE_URL`.

## Next Steps

1. **Enhanced Error Handling**: Add retry logic and better error recovery
2. **Real-time Updates**: Use Supabase subscriptions for live domain updates
3. **Bulk Operations**: Support for adding/removing multiple domains
4. **Domain Validation**: Add DNS validation and health checking
5. **Theme Integration**: Connect domains to blog themes and content generation

## Support

For issues or questions:
1. Check the logs in Supabase Functions dashboard
2. Use the debug helpers in `DomainsApiHelper`
3. Review this guide for common solutions
4. Test with the example component for reference implementation
