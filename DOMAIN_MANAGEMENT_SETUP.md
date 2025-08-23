# Enhanced Domain Management System Setup

🚀 **Complete Netlify API Integration with Automatic Database Sync**

## Overview

This enhanced domain management system provides:
- **Automatic two-way sync** between Supabase database and Netlify
- **Database triggers** that automatically call Netlify API when domains are added/updated
- **Supabase Edge Functions** for secure Netlify API communication
- **Real-time updates** and comprehensive error handling
- **User-friendly interface** with sync status monitoring

## Quick Setup

### 1. Environment Variables ✅
```bash
NETLIFY_SITE_ID=ca6261e6-0a59-40b5-a2bc-5b5481ac8809
NETLIFY_ACCESS_TOKEN=nfp_Xngqzk9sydkiKUvfdrqHLSnBCZiH33U8b967
```
*Already configured in your environment*

### 2. Database Setup
Run the setup script to create the domains table with triggers:

```bash
npm run domains:setup
```

Or manually run the SQL in your Supabase SQL editor:
```sql
-- See scripts/setup-domains-table.sql for the complete script
```

### 3. Verify Setup
Test the domain system:

```bash
npm run domains:test
```

## How It Works

### Database-First Approach
1. **Add Domain**: Insert into `domains` table
2. **Trigger Fires**: `sync_domain_with_netlify()` function automatically called
3. **API Call**: Supabase Edge Function calls Netlify API
4. **Update Status**: Database updated with sync results

### Automatic Sync Flow
```
User adds domain → Database INSERT → Trigger → Edge Function → Netlify API → Status Update
```

### Two-Way Sync
- **Database → Netlify**: Automatic via triggers
- **Netlify → Database**: Manual sync button in UI
- **Conflict Resolution**: Database is source of truth

## API Endpoints

### Supabase Edge Function: `/functions/domains`

**Add Domain to Netlify:**
```json
{
  "action": "add",
  "domain": "example.com",
  "txt_record_value": "optional-verification-value"
}
```

**Remove Domain from Netlify:**
```json
{
  "action": "remove"
}
```

**List DNS Zones:**
```json
{
  "action": "list_dns"
}
```

**Add DNS Record:**
```json
{
  "action": "add_dns",
  "zone_id": "zone_id",
  "domain": "subdomain.example.com"
}
```

**Delete DNS Record:**
```json
{
  "action": "delete_dns",
  "zone_id": "zone_id",
  "record_id": "record_id"
}
```

## Database Schema

### `domains` Table
```sql
CREATE TABLE domains (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  domain text NOT NULL UNIQUE,
  status text DEFAULT 'pending' CHECK (status IN ('pending', 'verified', 'removed', 'error')),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  netlify_verified boolean DEFAULT false,
  dns_verified boolean DEFAULT false,
  txt_record_value text,
  error_message text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  last_sync timestamptz,
  custom_domain boolean DEFAULT false,
  ssl_status text DEFAULT 'none' CHECK (ssl_status IN ('none', 'pending', 'issued', 'error')),
  dns_records jsonb DEFAULT '[]'::jsonb
);
```

### `sync_logs` Table
```sql
CREATE TABLE sync_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  table_name text NOT NULL,
  record_id uuid,
  action text,
  payload jsonb,
  response jsonb,
  error_message text,
  created_at timestamptz DEFAULT now()
);
```

## User Interface

### Enhanced Domain Manager Features
- **Real-time sync status** monitoring
- **Automatic triggers** for seamless integration
- **Manual sync** button for immediate updates
- **Error handling** with detailed messages
- **Netlify connection status** display
- **Comprehensive statistics** dashboard

### Domain Status Indicators
- 🟢 **Synced**: Domain exists in both database and Netlify
- 🔵 **In Netlify**: Domain verified in Netlify
- 🟡 **Pending**: Domain added to database, sync in progress
- 🔴 **Error**: Sync failed, check error message
- ⚪ **Database Only**: Domain exists only in database

## Troubleshooting

### Common Issues

**1. Environment Variables Missing**
```bash
# Check if variables are set
echo $NETLIFY_SITE_ID
echo $NETLIFY_ACCESS_TOKEN
```

**2. Database Table Missing**
```bash
npm run domains:setup
```

**3. Sync Not Working**
- Check `sync_logs` table for errors
- Verify Netlify credentials
- Check Edge Function deployment

**4. Manual Database Setup**
If automatic setup fails, run the SQL manually in Supabase SQL editor:
```sql
-- Copy contents from scripts/setup-domains-table.sql
```

### Debug Commands

**Check Domain System:**
```bash
npm run domains:test
```

**View Sync Logs:**
```sql
SELECT * FROM sync_logs ORDER BY created_at DESC LIMIT 10;
```

**Manual Domain Sync:**
```sql
SELECT trigger_domain_sync('domain-uuid-here');
```

## Security Features

- **Row Level Security (RLS)** enabled on all tables
- **User isolation** - users can only see their own domains
- **Secure API calls** via Supabase Edge Functions
- **Environment variable protection** - tokens never exposed to frontend
- **Audit logging** for all sync operations

## Next Steps

1. **Visit `/domains`** to start managing domains
2. **Add your first domain** and watch automatic sync
3. **Monitor sync status** and resolve any errors
4. **Use manual sync** when needed
5. **Check sync logs** for debugging

---

✅ **System Ready!** Your enhanced domain management system is now fully configured with automatic Netlify API integration.
